"""
장소 정보 Enricher
AI가 생성한 장소명에 실제 주소/전화번호/좌표를 붙여주는 서비스.

전략 (방법 3 — 혼합):
- tourist (관광지)    → DB 우선 조회 → 없으면 카카오 로컬 API
- restaurant / dessert / nightfood → 카카오 로컬 API (실시간, 폐업 반영)
- accommodation (숙소) → 카카오 로컬 API (실시간)
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.models.place import Place
from app.services.kakao_local import search_place


# 카카오 실시간 호출을 우선할 카테고리
REALTIME_CATEGORIES = {"restaurant", "dessert", "nightfood", "accommodation"}

# DB 우선 조회 후 없으면 카카오로 폴백할 카테고리
DB_FIRST_CATEGORIES = {"tourist"}


async def enrich_place(
    place_name: str,
    category: str,
    region: Optional[str],
    db: Session,
) -> dict:
    """
    장소명 + 카테고리로 실제 장소 정보를 조회합니다.

    Returns:
        {
            place_name, address, phone_number,
            latitude, longitude, kakao_url (optional)
        }
    """
    info = None

    if category in DB_FIRST_CATEGORIES:
        # 1순위: DB에서 조회
        info = _search_db(place_name, category, region, db)

    if info is None:
        # DB 미조회 카테고리이거나 DB에 없는 경우 → 카카오 로컬 API
        info = await search_place(place_name, category, region)

    # API/DB 모두 실패하면 장소명만 유지
    if info is None:
        return {"place_name": place_name}

    return {
        "place_name":   info.get("place_name") or place_name,
        "address":      info.get("address"),
        "phone_number": info.get("phone_number"),
        "latitude":     info.get("latitude"),
        "longitude":    info.get("longitude"),
        "kakao_url":    info.get("kakao_url"),
    }


def _search_db(
    place_name: str,
    category: str,
    region: Optional[str],
    db: Session,
) -> Optional[dict]:
    """
    Place 테이블에서 장소명 유사 검색.
    """
    query = db.query(Place).filter(
        Place.category == category,
        Place.place_name.ilike(f"%{place_name}%"),
    )
    if region:
        query = query.filter(Place.region == region)

    place = query.first()
    if not place:
        return None

    return {
        "place_name":   place.place_name,
        "address":      place.address,
        "phone_number": place.phone_number,
        "latitude":     place.latitude,
        "longitude":    place.longitude,
        "kakao_url":    None,
    }


async def enrich_places_bulk(
    places: list,
    region: Optional[str],
    db: Session,
) -> list:
    """
    AI가 생성한 places 리스트 전체를 일괄 enrichment.

    Args:
        places: GeneratedPlaceItem.model_dump() 리스트
        region: 요청 지역
        db: DB 세션

    Returns:
        enrichment된 places 리스트
    """
    enriched = []
    for item in places:
        place_name = item.get("place_name", "")
        category   = item.get("category", "")

        extra = await enrich_place(place_name, category, region, db)

        enriched.append({
            **item,
            "address":      extra.get("address"),
            "phone_number": extra.get("phone_number"),
            "latitude":     extra.get("latitude"),
            "longitude":    extra.get("longitude"),
            "kakao_url":    extra.get("kakao_url"),
            # API에서 더 정확한 장소명을 가져온 경우 덮어씀
            "place_name":   extra.get("place_name") or place_name,
        })

    return enriched
