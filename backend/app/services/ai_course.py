"""
AI 코스 생성 서비스 (LangChain + Claude)
ANTHROPIC_API_KEY 환경변수가 없으면 더미 데이터를 반환합니다.
"""

import json
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.course import CourseGenerateRequest, GeneratedPlaceItem
from app.services.place_enricher import enrich_places_bulk


# ── 하루 표준 일정 템플릿 (순서 고정) ──────────────────────────────────────────────
# 1.조식 2.디저트 3.관광지 4.중식 5.디저트 6.관광지 7.관광지 8.석식 9.디저트 10.관광지 11.야식 12.숙소
DAY_TEMPLATE = [
    ("조식", "restaurant"),
    ("디저트", "dessert"),
    ("관광지", "tourist"),
    ("중식", "restaurant"),
    ("디저트", "dessert"),
    ("관광지", "tourist"),
    ("관광지", "tourist"),
    ("석식", "restaurant"),
    ("디저트", "dessert"),
    ("관광지", "tourist"),
    ("야식", "nightfood"),
    ("숙소", "accommodation"),
]

# 시작/종료일정 select 값 -> DAY_TEMPLATE 인덱스
MEAL_TO_TEMPLATE_INDEX = {
    "조식": 0,
    "오전간식": 1,
    "중식": 3,
    "오후간식": 4,
    "석식": 7,
    "야식": 10,
}


def _duration_days(start: date, end: date) -> int:
    return max(1, (end - start).days + 1)


def _day_boundary_rules(req: CourseGenerateRequest, days: int) -> List[str]:
    """시작/종료일정 선택에 따른 1일차·마지막날 구성 규칙 (여행 2일 이상일 때만 적용)."""
    rules = []
    if days < 2:
        return rules

    if req.start_meal and req.start_meal in MEAL_TO_TEMPLATE_INDEX:
        idx = MEAL_TO_TEMPLATE_INDEX[req.start_meal]
        included = " → ".join(label for label, _ in DAY_TEMPLATE[idx:-1])  # 숙소 제외(아래 규칙에서 별도 처리)
        rules.append(
            f'- 1일차는 "{req.start_meal}"부터 시작합니다. 1일차 순서: {included} '
            f'(표준 순서에서 "{req.start_meal}" 이전 항목은 1일차에 포함하지 마세요)'
        )

    if req.end_meal and req.end_meal in MEAL_TO_TEMPLATE_INDEX:
        idx = MEAL_TO_TEMPLATE_INDEX[req.end_meal]
        included = " → ".join(label for label, _ in DAY_TEMPLATE[:idx + 1])
        rules.append(
            f'- 마지막 날은 "{req.end_meal}"까지 진행하고 종료합니다. 마지막 날 순서: {included} '
            f'(표준 순서에서 "{req.end_meal}" 이후 항목은 마지막 날에 포함하지 마세요)'
        )

    return rules


def _build_prompt(req: CourseGenerateRequest) -> str:
    days = _duration_days(req.start_date, req.end_date)
    day_template_text = " → ".join(f"{i + 1}.{label}" for i, (label, _) in enumerate(DAY_TEMPLATE))
    boundary_rules = "\n".join(_day_boundary_rules(req, days))
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

## 하루 표준 일정 순서 (중간 날짜는 이 순서를 기본으로 구성)
{day_template_text}

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
- place_name은 지도 앱(카카오맵/네이버지도)에서 검색하면 바로 찾을 수 있는 실제 상호명·고유명사를 사용하세요.
  - 금지: "{req.region} 현지 식당", "OO 해안 식당", "감성 카페", "동네 맛집", "로컬 맛집" 처럼 지역명+업종을 조합해 지어낸 뭉뚱그린 이름
  - {req.region}에 대해 확실히 아는 실제 상호명이 부족하면, 개수를 줄이더라도 확실히 존재하는 곳만 포함하세요.
- 모든 장소는 반드시 "{req.region}" 행정구역 안에 실제로 위치해야 합니다. {req.region}을 벗어난 다른 읍/면/동의 장소(예: {req.region}이 아닌 지역의 유명 관광지)는 아무리 유명해도 절대 포함하지 마세요.
- 이동 동선이 {req.region} 안에서만 이어지도록 구성 (다른 지역으로 왕복하는 동선 금지)
- 각 day마다 시간순 정렬
- accommodation은 마지막 일정 제외하고 매일 포함
{boundary_rules}
- JSON만 반환, 마크다운 코드블록 없이
""".strip()


async def generate_course(
    req: CourseGenerateRequest,
    db: Optional[Session] = None,
) -> dict:
    """
    Claude가 있으면 실제 AI 생성, 없으면 더미 반환.
    db가 전달되면 장소 정보를 카카오/TourAPI로 enrichment.
    """
    api_key = settings.ANTHROPIC_API_KEY

    if api_key:
        try:
            result = await _generate_with_claude(req, api_key)
        except Exception:
            # 응답 파싱 실패 등으로 AI 생성이 깨지면 더미로 안전하게 대체
            result = _generate_dummy(req)
    else:
        result = _generate_dummy(req)

    # 장소 정보 enrichment (주소, 전화번호, 좌표 보강)
    if db is not None:
        result["places"] = await enrich_places_bulk(
            result["places"], req.region, db
        )

    return result


async def _generate_with_claude(req: CourseGenerateRequest, api_key: str) -> dict:
    from langchain_anthropic import ChatAnthropic
    from langchain.schema import HumanMessage

    llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0.7, max_tokens=8192, api_key=api_key)
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
