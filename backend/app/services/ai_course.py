"""
AI 코스 생성 서비스 (LangChain + OpenAI)
OPENAI_API_KEY 환경변수가 없으면 더미 데이터를 반환합니다.
"""

import json
import os
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.schemas.course import CourseGenerateRequest, GeneratedPlaceItem
from app.services.place_enricher import enrich_places_bulk


# ── 카테고리별 시간 매핑 ──────────────────────────────────────────────────────────

CATEGORY_TIME = {
    "restaurant_breakfast": "08:00",
    "dessert_morning": "10:00",
    "tourist": "10:30",
    "restaurant_lunch": "12:30",
    "dessert_afternoon": "14:30",
    "restaurant_dinner": "18:00",
    "dessert_evening": "20:00",
    "nightfood": "21:00",
    "accommodation": "22:00",
}

CATEGORY_LABEL = {
    "restaurant_breakfast": "restaurant",
    "dessert_morning": "dessert",
    "tourist": "tourist",
    "restaurant_lunch": "restaurant",
    "dessert_afternoon": "dessert",
    "restaurant_dinner": "restaurant",
    "dessert_evening": "dessert",
    "nightfood": "nightfood",
    "accommodation": "accommodation",
}


def _duration_days(start: date, end: date) -> int:
    return max(1, (end - start).days + 1)


def _build_prompt(req: CourseGenerateRequest) -> str:
    days = _duration_days(req.start_date, req.end_date)
    return f"""
당신은 제주도 여행 전문 AI 코디네이터입니다.
아래 조건에 맞는 제주도 여행 코스를 JSON 형식으로 생성해주세요.

## 조건
- 여행 목적: {req.travel_style}
- 기간: {req.start_date} ~ {req.end_date} ({days}일)
- 지역: {req.region}
- 하루 식사 횟수: {req.meal_count}회
- 하루 관광지 횟수: {req.tourist_count}곳
- 이동방법: {req.transport}

## 출력 형식 (JSON만 반환, 설명 없음)
{{
  "title": "코스 제목",
  "description": "코스 설명 (2~3문장)",
  "places": [
    {{
      "day": 1,
      "visit_order": 1,
      "place_name": "장소명",
      "category": "restaurant|tourist|accommodation|dessert|nightfood",
      "time": "HH:MM",
      "memo": "간단한 설명"
    }}
  ]
}}

## 규칙
- day는 1부터 시작
- 실제 제주도에 존재하는 장소명 사용
- 지역({req.region}) 내 장소 우선
- 각 day마다 시간순 정렬
- accommodation은 마지막 일정 제외하고 매일 포함
- JSON만 반환, 마크다운 코드블록 없이
""".strip()


async def generate_course(
    req: CourseGenerateRequest,
    db: Optional[Session] = None,
) -> dict:
    """
    OpenAI가 있으면 실제 AI 생성, 없으면 더미 반환.
    db가 전달되면 장소 정보를 카카오/TourAPI로 enrichment.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if api_key:
        result = await _generate_with_openai(req, api_key)
    else:
        result = _generate_dummy(req)

    # 장소 정보 enrichment (주소, 전화번호, 좌표 보강)
    if db is not None:
        result["places"] = await enrich_places_bulk(
            result["places"], req.region, db
        )

    return result


async def _generate_with_openai(req: CourseGenerateRequest, api_key: str) -> dict:
    from langchain_openai import ChatOpenAI
    from langchain.schema import HumanMessage

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, api_key=api_key)
    prompt = _build_prompt(req)

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()

    # 마크다운 코드블록 제거
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    data = json.loads(raw)

    # visit_order 재정렬 (day 기준으로 1부터)
    from collections import defaultdict
    day_map = defaultdict(list)
    for item in data["places"]:
        day_map[item["day"]].append(item)

    places = []
    for day_num in sorted(day_map.keys()):
        for order, item in enumerate(day_map[day_num], start=1):
            item["visit_order"] = order
            places.append(item)

    data["places"] = places
    return data


def _generate_dummy(req: CourseGenerateRequest) -> dict:
    """OPENAI_API_KEY 없을 때 반환하는 샘플 코스."""
    days = _duration_days(req.start_date, req.end_date)

    sample_by_style = {
        "휴식": [
            ("카페 봄날", "dessert", "09:00", "제주 감성 카페"),
            ("협재 해수욕장", "tourist", "10:30", "에메랄드 바다"),
            ("삼도횟집", "restaurant", "12:30", "신선한 해산물 점심"),
            ("한림공원", "tourist", "14:00", "용암동굴과 야자수"),
            ("애월 카페거리", "dessert", "16:00", "인스타 감성 카페"),
            ("흑돼지 원조거리", "restaurant", "18:30", "제주 흑돼지 저녁"),
            ("제주 롯데시티호텔", "accommodation", "22:00", "숙소"),
        ],
        "등산": [
            ("한라산 성판악 탐방로", "tourist", "06:00", "한라산 등산 시작"),
            ("정상 백록담", "tourist", "10:00", "한라산 정상"),
            ("성판악 휴게소", "restaurant", "13:00", "등산 후 점심"),
            ("서귀포 매일올레시장", "tourist", "15:00", "시장 구경"),
            ("이시돌 목장 카페", "dessert", "17:00", "목장 밀크티"),
            ("고기국수 전문점", "restaurant", "19:00", "제주 고기국수"),
            ("서귀포 칼 호텔", "accommodation", "21:00", "숙소"),
        ],
    }

    base_schedule = sample_by_style.get(req.travel_style, sample_by_style["휴식"])

    places = []
    order_counter = 1
    for day in range(1, days + 1):
        for i, (name, cat, time, memo) in enumerate(base_schedule):
            # 마지막 날은 accommodation 제외
            if day == days and cat == "accommodation":
                continue
            places.append(GeneratedPlaceItem(
                day=day,
                visit_order=order_counter,
                place_name=name,
                category=cat,
                time=time,
                memo=memo,
            ).model_dump())
            order_counter += 1

    title = f"{req.region} {req.travel_style} {days}일 코스"
    description = (
        f"{req.region}에서 즐기는 {req.travel_style} 테마 {days}일 여행. "
        f"{req.transport}로 이동하며 제주의 매력을 만끽하세요."
    )
    return {"title": title, "description": description, "places": places}
