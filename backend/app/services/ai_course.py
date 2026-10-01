"""
AI 코스 생성 서비스 (LangChain + Claude)
ANTHROPIC_API_KEY 환경변수가 없으면 더미 데이터를 반환합니다.
"""

import json
from datetime import date
from typing import Callable, Dict, List, NamedTuple, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.course import CourseGenerateRequest, GeneratedPlaceItem
from app.services.olle_routes import OLLE_COURSES, OlleCourse, olle_courses_for_region
from app.services.kakao_local import find_coordinates, search_nearby
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

MAX_BLOCKS_PER_DAY = 12
# 올레 날에 올레 지점이 아닌 블록: 조식·중식·디저트·석식·숙소
OLLE_NON_POINT_BLOCKS = 5
MAX_OLLE_POINTS = MAX_BLOCKS_PER_DAY - OLLE_NON_POINT_BLOCKS

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


def _day_boundary_rules(req: CourseGenerateRequest, days: int, with_template: bool = True) -> List[str]:
    """시작/종료일정 선택에 따른 1일차·마지막날 구성 규칙 (여행 2일 이상일 때만 적용)."""
    rules = []
    if days < 2:
        return rules

    if not with_template:
        if req.start_meal in MEAL_TO_TEMPLATE_INDEX:
            rules.append(f'- 1일차는 "{req.start_meal}"부터 시작합니다. 그보다 이른 식사·일정은 1일차에 넣지 마세요.')
        if req.end_meal in MEAL_TO_TEMPLATE_INDEX:
            rules.append(f'- 마지막 날은 "{req.end_meal}"까지 진행하고 종료합니다. 그 이후 일정은 넣지 마세요.')
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


class PurposeGuide(NamedTuple):
    schedule: str             # "하루 일정 순서" 섹션 본문
    area_rules: List[str]     # 지역·동선 관련 규칙
    extra_section: str = ""   # 목적별 추가 섹션 (없으면 생략)
    extra_rules: List[str] = []
    template_boundaries: bool = True  # False면 시작/종료 식사 규칙에 표준 순서를 나열하지 않음


def _default_guide(req: CourseGenerateRequest, days: int) -> PurposeGuide:
    return PurposeGuide(
        schedule="(중간 날짜는 이 순서를 기본으로 구성)\n"
        + " → ".join(f"{i + 1}.{label}" for i, (label, _) in enumerate(DAY_TEMPLATE)),
        area_rules=[
            f'- 모든 장소는 반드시 "{req.region}" 행정구역 안에 실제로 위치해야 합니다. {req.region}을 벗어난 다른 읍/면/동의 장소(예: {req.region}이 아닌 지역의 유명 관광지)는 아무리 유명해도 절대 포함하지 마세요.',
            f"- 이동 동선이 {req.region} 안에서만 이어지도록 구성 (다른 지역으로 왕복하는 동선 금지)",
        ],
    )


def _olle_course_line(day: int, course: OlleCourse) -> str:
    meta = ", ".join(x for x in [
        f"약 {course['distance_km']}km" if course["distance_km"] else "",
        course["hours"] or "",
    ] if x)
    head = f"- {day}일차: 제주올레 {course['code']}코스 ({course['start']} → {course['end']}{', ' + meta if meta else ''})"
    if course["waypoints"]:
        return head + "\n  경유지 후보(경로 순서, 이름 그대로 사용): " + " → ".join(course["waypoints"])
    return head + "\n  경유지 후보: 공식 경로의 주요 지점을 경로 순서대로 (확실히 아는 지점만)"


def _olle_guide(req: CourseGenerateRequest, days: int) -> PurposeGuide:
    courses = olle_courses_for_region(req.region)
    if courses:
        assigned = courses[:days]
        lines = [_olle_course_line(i + 1, c) for i, c in enumerate(assigned)]
        if days > len(assigned):
            lines.append(
                f"- {len(assigned) + 1}일차 이후: 걸을 올레 코스가 더 없으므로 "
                f"{req.region}과 마지막 코스 종점 인근에서 가볍게 산책·휴식하는 일정"
            )
        plan = "\n".join(lines)
    else:
        all_courses = ", ".join(f"{c['code']}({c['start']}→{c['end']})" for c in OLLE_COURSES)
        plan = (
            f"- \"{req.region}\"을 지나는 올레 정규 코스가 없습니다. 아래 목록에서 {req.region}과 가장 가까운 코스를 "
            f"골라 하루 한 코스씩 배정하고, description에 그 이유를 한 문장으로 적으세요.\n  코스 목록: {all_courses}"
        )

    return PurposeGuide(
        extra_section=f"## 제주올레 코스 배정 (하루 한 코스)\n{plan}",
        schedule=(
            "(올레를 걷는 날은 아래 순서로 구성)\n"
            "조식(시작점 인근) → 올레 시작점 → 경유지들 → 중식(코스 중간 지점 인근) → 경유지들 → "
            "종점 → 디저트(종점 인근) → 석식 → 숙소"
        ),
        area_rules=[
            f"- 지역 제한은 행정구역이 아니라 올레 코스 경로 기준입니다. 코스가 {req.region} 밖으로 이어지면 경로를 따라가세요.",
            "- 올레 경로에서 벗어난 유명 관광지를 따로 끼워 넣지 마세요.",
            "- 식당·카페·숙소는 그 시점의 올레 경로에서 도보 10분 이내의 실제 업체로 고르세요. 숙소는 다음 날 코스 시작점 가까이.",
        ],
        extra_rules=[
            "- 올레 시작점·경유지·종점은 category를 \"tourist\"로, memo는 \"올레 17코스 시작점\" / \"올레 17코스 경유\" / \"올레 17코스 종점\" 형식으로 적으세요.",
            f"- 올레 지점(시작점·경유지·종점 합계)은 하루 {MAX_OLLE_POINTS}곳 이내입니다. 시작점과 종점은 반드시 넣고, 경유지 후보 중 꼭 들를 만한 대표 지점만 경로 순서대로 고르세요.",
            "- 올레 한 코스(약 20km)는 3~5시간 걸어서 완주합니다(시속 4~6km). 시작점 출발부터 종점 도착까지 걷는 시간이 중식을 빼고 3~5시간이 되도록 time을 정하세요. 예: 시작점 08:30 출발, 중식 1시간이면 종점 도착은 12:30~14:30. 이동방법 조건은 올레 구간에서는 무시합니다.",
            "- 경유지의 stay_minutes는 그곳에서 구경·휴식하는 시간(10~20분)만 넣으세요.",
            "- title에는 코스 번호를 넣으세요 (예: \"제주올레 17·18코스 2일 걷기\").",
            "- 하루 관광지 횟수 조건은 올레 경유지에는 적용하지 않습니다.",
        ],
        template_boundaries=False,
    )


PURPOSE_GUIDES: Dict[str, Callable[[CourseGenerateRequest, int], PurposeGuide]] = {
    "제주올레": _olle_guide,
}


def _build_prompt(req: CourseGenerateRequest) -> str:
    days = _duration_days(req.start_date, req.end_date)
    guide = PURPOSE_GUIDES.get(req.travel_style, _default_guide)(req, days)
    rules = "\n".join([
        "- day는 1부터 시작",
        "- place_name은 지도 앱(카카오맵/네이버지도)에서 검색하면 바로 찾을 수 있는 실제 상호명·고유명사를 사용하세요.",
        f'  - 금지: "{req.region} 현지 식당", "OO 해안 식당", "감성 카페", "동네 맛집", "로컬 맛집" 처럼 지역명+업종을 조합해 지어낸 뭉뚱그린 이름',
        f"  - {req.region}에 대해 확실히 아는 실제 상호명이 부족하면, 개수를 줄이더라도 확실히 존재하는 곳만 포함하세요.",
        '  - 숙소·카페도 마찬가지입니다. "제주 시내 호텔", "OO 해물 식당", "카페 OO(지명)"처럼 지어낸 이름은 쓰지 마세요.',
        "- category: 조식·중식·석식은 restaurant, 디저트·카페는 dessert, 야식은 nightfood, 숙소는 accommodation, 그 외 방문지는 tourist",
        *guide.area_rules,
        "- 각 day마다 시간순 정렬",
        f"- 하루 장소는 {MAX_BLOCKS_PER_DAY}개 이내로 구성하세요. {MAX_BLOCKS_PER_DAY}개를 꼭 채울 필요는 없고, 동선과 시간에 무리가 없는 만큼만 넣으세요.",
        "- stay_minutes는 그 장소에서 머무는 시간(분, 정수)입니다. 이동 시간은 빼고, 다음 장소의 time과 겹치지 않게 잡으세요. 숙소는 다음 날 출발까지의 시간으로 넣으세요.",
        "- accommodation은 마지막 일정 제외하고 매일 포함",
        *guide.extra_rules,
        *_day_boundary_rules(req, days, guide.template_boundaries),
        "- JSON만 반환, 마크다운 코드블록 없이",
    ])
    extra_section = f"\n{guide.extra_section}\n" if guide.extra_section else ""
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
{extra_section}
## 하루 일정 순서 {guide.schedule}

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
      "stay_minutes": 60,
      "memo": "간단한 설명"
    }}
  ]
}}

## 규칙
{rules}
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
        original_names = [p["place_name"] for p in result["places"]]
        result["places"] = await enrich_places_bulk(
            result["places"], req.region, db
        )
        # 올레 지점은 검색 첫 결과(예: 용두암 → 용두암해수랜드)로 이름이 바뀌면 안 되므로 원래 이름 유지.
        # 검색 결과가 다른 장소로 보이면 주소·좌표도 버린다.
        for place, name in zip(result["places"], original_names):
            if not str(place.get("memo") or "").startswith("올레 "):
                continue
            found = place["place_name"].replace(" ", "")
            if not (name.replace(" ", "") in found or found in name.replace(" ", "")):
                for key in ("address", "road_address", "phone_number", "latitude", "longitude", "kakao_url"):
                    place[key] = None
            place["place_name"] = name

    if req.travel_style == "제주올레":
        result["places"] = await _place_olle_lunch(result["places"])

    return result


LUNCH_WINDOW = (11 * 60, 13 * 60 + 30)   # 이 시간대에 도착하는 올레 지점 근처에서 점심
LUNCH_MINUTES = 60
LUNCH_SEARCH_RADII = (700, 1500, 3000)    # m, 가까운 곳부터 넓혀 가며 검색
LUNCH_EXCLUDE = ("간식", "술집", "카페", "패스트푸드", "뷔페")


def _to_min(t: Optional[str]) -> Optional[int]:
    try:
        h, m = str(t).split(":")[:2]
        return int(h) * 60 + int(m)
    except (ValueError, AttributeError):
        return None


def _to_time(minutes: int) -> str:
    minutes = max(0, min(minutes, 23 * 60 + 59))
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _pick_lunch_anchor(points: list) -> Optional[dict]:
    """점심을 먹을 올레 지점: 중간 지점 → (짧은 코스면) 종점 → 12시에 가장 가까운 지점."""
    timed = [p for p in points if _to_min(p.get("time")) is not None]
    if len(timed) < 2:
        return None
    mid = timed[len(timed) // 2]
    if LUNCH_WINDOW[0] <= _to_min(mid["time"]) <= LUNCH_WINDOW[1]:
        return mid
    end = timed[-1]
    if _to_min(end["time"]) <= LUNCH_WINDOW[1]:
        return end
    return min(timed[1:], key=lambda p: abs(_to_min(p["time"]) - 12 * 60))


async def _find_lunch_near(point: dict) -> Optional[dict]:
    coords = None
    if point.get("longitude") and point.get("latitude"):
        coords = (point["longitude"], point["latitude"])
    else:
        coords = await find_coordinates(f"제주 {point['place_name']}")
    if not coords:
        return None
    for radius in LUNCH_SEARCH_RADII:
        docs = await search_nearby("FD6", coords[0], coords[1], radius)
        docs = [d for d in docs if not any(word in d.get("category_name", "") for word in LUNCH_EXCLUDE)]
        if docs:
            return docs[0]
    return None


async def _place_olle_lunch(places: list) -> list:
    """올레 날의 점심을 올레 경로 위 지점 주변 실제 식당으로 교체하고 이후 시각을 다시 맞춘다."""
    result = []
    for day in sorted({p["day"] for p in places}):
        items = [p for p in places if p["day"] == day]
        points = [p for p in items if str(p.get("memo") or "").startswith("올레 ")]
        anchor = _pick_lunch_anchor(points)
        doc = await _find_lunch_near(anchor) if anchor else None
        if not doc:
            result.extend(items)
            continue

        start_min, end_min = _to_min(points[0]["time"]), _to_min(points[-1]["time"])
        meals = [
            p for p in items
            if p["category"] == "restaurant" and p not in points and _to_min(p.get("time")) is not None
        ]
        # AI가 넣은 점심: 올레 구간 중의 식당, 없으면 완주 직후 14:30 전의 식당
        old_lunch = next((p for p in meals if start_min < _to_min(p["time"]) < end_min), None) or next(
            (p for p in meals if end_min <= _to_min(p["time"]) <= 14 * 60 + 30), None
        )
        if old_lunch:
            idx = items.index(old_lunch)
            gap = (_to_min(items[idx + 1]["time"]) - _to_min(old_lunch["time"])) if idx + 1 < len(items) else 0
            items.pop(idx)
            for p in items[idx:]:
                if _to_min(p.get("time")) is not None:
                    p["time"] = _to_time(_to_min(p["time"]) - max(gap, 0))

        idx = items.index(anchor) + 1
        lunch_time = _to_min(anchor["time"]) + (anchor.get("stay_minutes") or 0)
        code = str(anchor["memo"]).split()[1] if len(str(anchor["memo"]).split()) > 1 else ""
        lunch = {
            "day": day,
            "visit_order": 0,
            "place_name": doc["place_name"],
            "category": "restaurant",
            "time": _to_time(lunch_time),
            "stay_minutes": LUNCH_MINUTES,
            "memo": f"중식 · 올레 {code} {anchor['place_name']} 인근 (약 {doc.get('distance') or '-'}m)",
            "address": doc.get("address_name") or None,
            "road_address": doc.get("road_address_name") or None,
            "phone_number": doc.get("phone") or None,
            "latitude": float(doc["y"]) if doc.get("y") else None,
            "longitude": float(doc["x"]) if doc.get("x") else None,
            "kakao_url": doc.get("place_url"),
        }
        items.insert(idx, lunch)
        for p in items[idx + 1:]:
            if _to_min(p.get("time")) is not None:
                p["time"] = _to_time(_to_min(p["time"]) + LUNCH_MINUTES)
        for order, p in enumerate(items, start=1):
            p["visit_order"] = order
        result.extend(items)
    return _limit_blocks_per_day(result)


def _limit_blocks_per_day(places: list) -> list:
    """AI가 하루 최대 블록 수를 넘긴 경우 덜 중요한 블록부터 덜어낸다."""
    def drop_priority(p: dict) -> int:
        memo = str(p.get("memo") or "")
        if memo.startswith("올레 ") and memo.endswith("경유"):
            return 0
        return {"dessert": 1, "nightfood": 2, "tourist": 3}.get(p.get("category"), 9)

    by_day: Dict[int, list] = {}
    for p in places:
        by_day.setdefault(p["day"], []).append(p)

    result = []
    for day in sorted(by_day):
        items = by_day[day]
        while len(items) > MAX_BLOCKS_PER_DAY:
            candidates = [p for p in items if drop_priority(p) < 9]
            if not candidates:
                items = items[:MAX_BLOCKS_PER_DAY]
                break
            lowest = min(drop_priority(p) for p in candidates)
            # 같은 우선순위 중 가운데 것을 빼서 경로가 한쪽으로 몰리지 않게 한다
            same = [p for p in candidates if drop_priority(p) == lowest]
            items.remove(same[len(same) // 2])
        for order, p in enumerate(items, start=1):
            p["visit_order"] = order
        result.extend(items)
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

    data["places"] = _limit_blocks_per_day(places)
    return data


def _generate_dummy(req: CourseGenerateRequest) -> dict:
    """OPENAI_API_KEY 없을 때 반환하는 샘플 코스."""
    days = _duration_days(req.start_date, req.end_date)

    sample_by_style = {
        "휴식": [
            ("카페 봄날", "dessert", "09:00", "제주 감성 카페", 60),
            ("협재 해수욕장", "tourist", "10:30", "에메랄드 바다", 90),
            ("삼도횟집", "restaurant", "12:30", "신선한 해산물 점심", 60),
            ("한림공원", "tourist", "14:00", "용암동굴과 야자수", 120),
            ("애월 카페거리", "dessert", "16:00", "인스타 감성 카페", 90),
            ("흑돼지 원조거리", "restaurant", "18:30", "제주 흑돼지 저녁", 90),
            ("제주 롯데시티호텔", "accommodation", "22:00", "숙소", 600),
        ],
        "등산": [
            ("한라산 성판악 탐방로", "tourist", "06:00", "한라산 등산 시작", 240),
            ("정상 백록담", "tourist", "10:00", "한라산 정상", 60),
            ("성판악 휴게소", "restaurant", "13:00", "등산 후 점심", 60),
            ("서귀포 매일올레시장", "tourist", "15:00", "시장 구경", 90),
            ("이시돌 목장 카페", "dessert", "17:00", "목장 밀크티", 60),
            ("고기국수 전문점", "restaurant", "19:00", "제주 고기국수", 60),
            ("서귀포 칼 호텔", "accommodation", "21:00", "숙소", 600),
        ],
    }

    base_schedule = sample_by_style.get(req.travel_style, sample_by_style["휴식"])

    places = []
    order_counter = 1
    for day in range(1, days + 1):
        for i, (name, cat, time, memo, stay) in enumerate(base_schedule):
            # 마지막 날은 accommodation 제외
            if day == days and cat == "accommodation":
                continue
            places.append(GeneratedPlaceItem(
                day=day,
                visit_order=order_counter,
                place_name=name,
                category=cat,
                time=time,
                stay_minutes=stay,
                memo=memo,
            ).model_dump())
            order_counter += 1

    title = f"{req.region} {req.travel_style} {days}일 코스"
    description = (
        f"{req.region}에서 즐기는 {req.travel_style} 테마 {days}일 여행. "
        f"{req.transport}로 이동하며 제주의 매력을 만끽하세요."
    )
    return {"title": title, "description": description, "places": places}
