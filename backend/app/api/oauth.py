import secrets
import string

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User

router = APIRouter()


def _check_credentials(provider: str, client_id: str, client_secret: str = ""):
    """Raise 501 if OAuth credentials are not configured."""
    if not client_id:
        raise HTTPException(
            status_code=501,
            detail="소셜 로그인 설정이 필요합니다. 관리자에게 문의하세요.",
        )


def _random_suffix(length: int = 6) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _get_unique_nickname(db: Session, base: str) -> str:
    nickname = base
    while db.query(User).filter(User.nickname == nickname).first():
        nickname = f"{base}_{_random_suffix()}"
    return nickname


def _issue_jwt(user: User) -> str:
    return create_access_token(data={"sub": str(user.id)})


def _get_or_create_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: str,
    nickname: str,
) -> User:
    # 1. Look up by provider + provider_id
    user = (
        db.query(User)
        .filter(User.provider == provider, User.provider_id == provider_id)
        .first()
    )
    if user:
        return user

    # 2. Look up by email (account merge)
    if email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.provider = provider
            user.provider_id = provider_id
            db.commit()
            db.refresh(user)
            return user

    # 3. Create new user
    safe_base = nickname[:12] if nickname else f"{provider}유저"
    unique_nickname = _get_unique_nickname(db, safe_base)
    new_user = User(
        email=email,
        password=f"oauth_{provider}_{provider_id}",
        nickname=unique_nickname,
        provider=provider,
        provider_id=provider_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ---------------------------------------------------------------------------
# Kakao
# ---------------------------------------------------------------------------

@router.get("/kakao/login")
async def kakao_login():
    _check_credentials("kakao", settings.KAKAO_CLIENT_ID, settings.KAKAO_CLIENT_SECRET)
    callback_url = f"{settings.BACKEND_URL}/api/auth/kakao/callback"
    url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={callback_url}"
        f"&response_type=code"
    )
    return RedirectResponse(url)


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    _check_credentials("kakao", settings.KAKAO_CLIENT_ID, settings.KAKAO_CLIENT_SECRET)
    callback_url = f"{settings.BACKEND_URL}/api/auth/kakao/callback"

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": callback_url,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        # Get user info
        user_resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        data = user_resp.json()

    provider_id = str(data["id"])
    kakao_account = data.get("kakao_account", {})
    email = kakao_account.get("email", f"kakao_{provider_id}@kakao.local")
    nickname = kakao_account.get("profile", {}).get("nickname", f"카카오유저")

    user = _get_or_create_user(db, "kakao", provider_id, email, nickname)
    jwt = _issue_jwt(user)
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt}")


# ---------------------------------------------------------------------------
# Naver
# ---------------------------------------------------------------------------

@router.get("/naver/login")
async def naver_login():
    _check_credentials("naver", settings.NAVER_CLIENT_ID, settings.NAVER_CLIENT_SECRET)
    state = secrets.token_urlsafe(16)
    callback_url = f"{settings.BACKEND_URL}/api/auth/naver/callback"
    url = (
        f"https://nid.naver.com/oauth2.0/authorize"
        f"?client_id={settings.NAVER_CLIENT_ID}"
        f"&redirect_uri={callback_url}"
        f"&response_type=code"
        f"&state={state}"
    )
    return RedirectResponse(url)


@router.get("/naver/callback")
async def naver_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    _check_credentials("naver", settings.NAVER_CLIENT_ID, settings.NAVER_CLIENT_SECRET)
    callback_url = f"{settings.BACKEND_URL}/api/auth/naver/callback"

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://nid.naver.com/oauth2.0/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_CLIENT_SECRET,
                "redirect_uri": callback_url,
                "code": code,
                "state": state,
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        profile = user_resp.json().get("response", {})

    provider_id = str(profile["id"])
    email = profile.get("email", f"naver_{provider_id}@naver.local")
    nickname = profile.get("nickname", "네이버유저")

    user = _get_or_create_user(db, "naver", provider_id, email, nickname)
    jwt = _issue_jwt(user)
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt}")


# ---------------------------------------------------------------------------
# Google
# ---------------------------------------------------------------------------

@router.get("/google/login")
async def google_login():
    _check_credentials("google", settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET)
    callback_url = f"{settings.BACKEND_URL}/api/auth/google/callback"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={callback_url}"
        f"&response_type=code"
        f"&scope=openid email profile"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    _check_credentials("google", settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET)
    callback_url = f"{settings.BACKEND_URL}/api/auth/google/callback"

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": callback_url,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": access_token},
        )
        user_resp.raise_for_status()
        data = user_resp.json()

    provider_id = str(data["sub"])
    email = data.get("email", f"google_{provider_id}@gmail.local")
    nickname = data.get("name", "구글유저")

    user = _get_or_create_user(db, "google", provider_id, email, nickname)
    jwt = _issue_jwt(user)
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt}")
