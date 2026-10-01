from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("비밀번호는 6자 이상이어야 합니다.")
        return v

    @field_validator("nickname")
    @classmethod
    def nickname_min_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("nickname")
    @classmethod
    def nickname_min_length(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v.strip()) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        return v.strip()

    @field_validator("bio")
    @classmethod
    def bio_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) > 200:
            raise ValueError("자기소개는 200자 이하여야 합니다.")
        return v or None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    profile_image: Optional[str]
    bio: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
