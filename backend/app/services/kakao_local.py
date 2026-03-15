"""
카카오 로컬 API 클라이언트
- 키워드로 장소 검색 (식당, 카페, 숙소 실시간 조회)
- REST API 키: KAKAO_REST_API_KEY 환경변수

공식 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
"""

from typing import Optional
import httpx

from app.core.config import settings

KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

# 카카오 카테고리 그룹 코드
CATEGORY_CODE = {
    "restaurant": "FD6",      # 음식점
    "dessert":    "CE7",      # 카페
    "nightfood":  "FD6",      # 음식점 (야식)
    "accommodation": "AD5",   # 숙박
    "tourist":    "AT4",      # 관광명소
}

# 제주도 중심 좌표
JEJU_CENTER = {"x": "126.5312", "y": "33.4996"}


async def search_place(
    place_name: str,
    category: str,
    region: Optional[str] = None,
) -> Optional[dict]:
    """
    장소명 + 카테고리로 카카오 로컬 API 검색.
    결과가 있으면 첫 번째 항목을 반환, 없으면 None.
    """
    if not settings.KAKAO_REST_API_KEY:
        return None

    query = f"제주 {region} {place_name}" if region else f"제주 {place_name}"
    category_group_code = CATEGORY_CODE.get(category, "")

    params = {
        "query": query,
        "size": 1,
        "x": JEJU_CENTER["x"],
        "y": JEJU_CENTER["y"],
        "radius": 50000,  # 50km (제주도 전체 커버)
    }
    if category_group_code:
        params["category_group_code"] = category_group_code

    headers = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(KAKAO_LOCAL_URL, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        documents = data.get("documents", [])
        if not documents:
            return None

        doc = documents[0]
        return {
            "place_name":   doc.get("place_name"),
            "address":      doc.get("road_address_name") or doc.get("address_name"),
            "phone_number": doc.get("phone"),
            "latitude":     float(doc["y"]) if doc.get("y") else None,
            "longitude":    float(doc["x"]) if doc.get("x") else None,
            "kakao_url":    doc.get("place_url"),
        }

    except Exception:
        # API 호출 실패 시 None 반환 (코스 생성 자체는 계속 진행)
        return None


async def search_places_by_category(
    category_code: str,
    region: str,
    size: int = 15,
) -> list:
    """
    카테고리 코드 + 지역으로 장소 목록 검색.
    Admin 장소 데이터 보강 용도.
    """
    if not settings.KAKAO_REST_API_KEY:
        return []

    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    params = {
        "query": f"제주 {region}",
        "category_group_code": category_code,
        "size": size,
        "x": JEJU_CENTER["x"],
        "y": JEJU_CENTER["y"],
        "radius": 50000,
    }
    headers = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json().get("documents", [])
    except Exception:
        return []
