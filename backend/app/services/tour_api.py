"""
한국관광공사 TourAPI 클라이언트
- 제주도 관광지 / 음식점 / 숙소 데이터를 공공데이터에서 가져옴
- API 키: TOUR_API_KEY 환경변수 (data.go.kr 에서 발급)

공식 문서: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15101578
"""

from typing import List, Optional
import httpx

from app.core.config import settings

TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService1"

# 제주도 지역코드
JEJU_AREA_CODE = "39"

# TourAPI contentTypeId
CONTENT_TYPE = {
    "tourist":       "12",   # 관광지
    "accommodation": "32",   # 숙박
    "restaurant":    "39",   # 음식점
}

# 제주 시군구 코드 (sigunguCode)
SIGUNGU_CODE = {
    "제주시":  "1",
    "서귀포시": "2",
    "애월읍":  "1",   # 제주시 소속
    "한림읍":  "1",
    "성산읍":  "2",   # 서귀포시 소속
    "안덕면":  "2",
    "남원읍":  "2",
    "표선읍":  "2",
    "구좌읍":  "1",
    "조천읍":  "1",
    "한경면":  "1",
    "대정읍":  "2",
}


async def fetch_jeju_places(
    content_type: str,
    region: Optional[str] = None,
    num_of_rows: int = 100,
) -> List[dict]:
    """
    TourAPI에서 제주 장소 목록을 가져옵니다.

    Args:
        content_type: "tourist" | "accommodation" | "restaurant"
        region: 제주 지역명 (예: "서귀포시", None이면 제주도 전체)
        num_of_rows: 가져올 최대 개수

    Returns:
        장소 정보 딕셔너리 리스트
    """
    if not settings.TOUR_API_KEY:
        return []

    type_id = CONTENT_TYPE.get(content_type)
    if not type_id:
        return []

    params = {
        "serviceKey":   settings.TOUR_API_KEY,
        "MobileOS":     "ETC",
        "MobileApp":    "TripMateJeju",
        "_type":        "json",
        "areaCode":     JEJU_AREA_CODE,
        "contentTypeId": type_id,
        "numOfRows":    num_of_rows,
        "pageNo":       1,
    }

    # 지역별 시군구 코드 추가
    if region and region in SIGUNGU_CODE:
        params["sigunguCode"] = SIGUNGU_CODE[region]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{TOUR_API_BASE}/areaBasedList1",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        items = (
            data.get("response", {})
                .get("body", {})
                .get("items", {})
                .get("item", [])
        )

        if isinstance(items, dict):
            items = [items]

        result = []
        for item in items:
            result.append({
                "place_name":  item.get("title", ""),
                "address":     item.get("addr1", ""),
                "latitude":    float(item["mapy"]) if item.get("mapy") else None,
                "longitude":   float(item["mapx"]) if item.get("mapx") else None,
                "place_image": item.get("firstimage", ""),
                "region":      region or "제주",
                "category":    content_type,
                "tour_id":     item.get("contentid", ""),
            })

        return result

    except Exception:
        return []


async def fetch_place_detail(content_id: str) -> Optional[dict]:
    """
    TourAPI에서 특정 장소 상세 정보(전화번호 등)를 가져옵니다.
    """
    if not settings.TOUR_API_KEY:
        return None

    params = {
        "serviceKey": settings.TOUR_API_KEY,
        "MobileOS":   "ETC",
        "MobileApp":  "TripMateJeju",
        "_type":      "json",
        "contentId":  content_id,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{TOUR_API_BASE}/detailCommon1",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        item = (
            data.get("response", {})
                .get("body", {})
                .get("items", {})
                .get("item", {})
        )
        if isinstance(item, list):
            item = item[0] if item else {}

        return {
            "phone_number": item.get("tel", ""),
            "description":  item.get("overview", ""),
            "place_image":  item.get("firstimage", ""),
        }

    except Exception:
        return None
