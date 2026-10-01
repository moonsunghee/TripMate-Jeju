"""
제주올레 정규 코스 데이터 (AI 코스 생성 프롬프트용)

- regions: 코스 경로가 주로 지나는 코스설계 지역값 (프론트 지역 선택값과 동일한 표기)
- waypoints: 경로 순서대로의 주요 지점. 검증된 코스만 채우고, 나머지는 시작·종점만 둔다.
- 거리는 제주올레 공식 안내 기준의 대략값, 소요시간은 한 코스(약 20km)를 3~5시간에 걷는 기준
"""

from typing import List, Optional, TypedDict


class OlleCourse(TypedDict):
    code: str
    start: str
    end: str
    regions: List[str]
    distance_km: Optional[float]
    hours: Optional[str]
    waypoints: List[str]


OLLE_COURSES: List[OlleCourse] = [
    {"code": "1", "start": "시흥초등학교", "end": "광치기해변", "regions": ["성산읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "1-1", "start": "우도 천진항", "end": "우도 천진항", "regions": ["우도"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "2", "start": "광치기해변", "end": "온평포구", "regions": ["성산읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "3-B", "start": "온평포구", "end": "표선해수욕장", "regions": ["성산읍", "표선면"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "4", "start": "표선해수욕장", "end": "남원포구", "regions": ["표선면", "남원읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "5", "start": "남원포구", "end": "쇠소깍다리", "regions": ["남원읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "6", "start": "쇠소깍다리", "end": "제주올레 여행자센터", "regions": ["서귀포시"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "7", "start": "제주올레 여행자센터", "end": "월평 아왜낭목", "regions": ["서귀포시"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "8", "start": "월평 아왜낭목", "end": "대평포구", "regions": ["서귀포시", "안덕면"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "9", "start": "대평포구", "end": "화순금모래해변", "regions": ["안덕면"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "10", "start": "화순금모래해변", "end": "하모체육공원", "regions": ["안덕면", "대정읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "10-1", "start": "가파도 상동포구", "end": "가파도 가파포구", "regions": ["가파도"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "11", "start": "하모체육공원", "end": "무릉외갓집", "regions": ["대정읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "12", "start": "무릉외갓집", "end": "용수포구", "regions": ["대정읍", "한경면"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "13", "start": "용수포구", "end": "저지예술정보화마을", "regions": ["한경면"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "14", "start": "저지예술정보화마을", "end": "한림항", "regions": ["한경면", "한림읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "15-B", "start": "한림항", "end": "고내포구", "regions": ["한림읍", "애월읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "16", "start": "고내포구", "end": "광령1리사무소", "regions": ["애월읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {
        "code": "17", "start": "광령1리사무소", "end": "제주올레 간세라운지(산지천마당)",
        "regions": ["제주시"], "distance_km": 18.1, "hours": "도보 3~5시간",
        "waypoints": [
            "광령1리사무소", "무수천", "외도 월대천", "내도 알작지해변", "이호테우해변",
            "도두봉", "용두암", "용연구름다리", "관덕정", "제주목 관아", "제주올레 간세라운지",
        ],
    },
    {
        "code": "18", "start": "제주올레 간세라운지(산지천마당)", "end": "조천만세동산",
        "regions": ["제주시"], "distance_km": 19.8, "hours": "도보 3~5시간",
        "waypoints": [
            "제주올레 간세라운지", "사라봉", "별도봉", "곤을동 4·3 유적지", "화북포구",
            "삼양검은모래해변", "원당봉", "신촌포구", "닭머르", "연북정", "조천만세동산",
        ],
    },
    {"code": "18-1", "start": "추자도 대서리 추자항", "end": "추자도 대서리 추자항", "regions": ["추자도"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "19", "start": "조천만세동산", "end": "김녕서포구", "regions": ["조천읍", "구좌읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "20", "start": "김녕서포구", "end": "제주해녀박물관", "regions": ["구좌읍"],
     "distance_km": None, "hours": None, "waypoints": []},
    {"code": "21", "start": "제주해녀박물관", "end": "종달바당", "regions": ["구좌읍"],
     "distance_km": None, "hours": None, "waypoints": []},
]


def olle_courses_for_region(region: str) -> List[OlleCourse]:
    return [c for c in OLLE_COURSES if region in c["regions"]]
