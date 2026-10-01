from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ── CoursePlace ────────────────────────────────────────────────────────────────

class CoursePlaceCreate(BaseModel):
    place_id: Optional[int] = None
    visit_order: int
    day: int = 1
    place_name: Optional[str] = None
    category: Optional[str] = None
    time: Optional[str] = None
    stay_minutes: Optional[int] = Field(None, ge=0, le=1440)
    address: Optional[str] = None
    road_address: Optional[str] = None
    memo: Optional[str] = None


class CoursePlaceResponse(BaseModel):
    id: int
    place_id: Optional[int]
    visit_order: int
    day: int
    place_name: Optional[str]
    category: Optional[str]
    time: Optional[str]
    stay_minutes: Optional[int] = None
    address: Optional[str] = Field(None, validation_alias="display_address")
    road_address: Optional[str] = Field(None, validation_alias="display_road_address")
    memo: Optional[str]
    place_image: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Course ─────────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    travel_image: Optional[str] = None
    duration_days: Optional[int] = None
    travel_style: Optional[str] = None
    region: Optional[str] = None
    transport: Optional[str] = None
    is_shared: bool = False
    is_recruiting: bool = False
    status: str = "master"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    places: List[CoursePlaceCreate] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    travel_image: Optional[str] = None
    duration_days: Optional[int] = None
    travel_style: Optional[str] = None
    region: Optional[str] = None
    transport: Optional[str] = None
    is_shared: Optional[bool] = None
    is_recruiting: Optional[bool] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    places: Optional[List[CoursePlaceCreate]] = None


class AuthorInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]

    model_config = {"from_attributes": True}


class CourseResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    travel_image: Optional[str]
    duration_days: Optional[int]
    travel_style: Optional[str]
    region: Optional[str]
    transport: Optional[str]
    is_shared: bool
    is_recruiting: bool
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[AuthorInfo]
    like_count: int = 0
    course_places: List[CoursePlaceResponse] = []

    model_config = {"from_attributes": True}


class CourseListItem(BaseModel):
    id: int
    user_id: int
    title: str
    travel_image: Optional[str]
    duration_days: Optional[int]
    travel_style: Optional[str]
    region: Optional[str]
    is_shared: bool
    is_recruiting: bool
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    user: Optional[AuthorInfo]
    like_count: int = 0

    model_config = {"from_attributes": True}


class CourseLikeResponse(BaseModel):
    liked: bool
    like_count: int


# ── AI 코스 생성 요청 ────────────────────────────────────────────────────────────

class CourseGenerateRequest(BaseModel):
    travel_style: str           # 여행 목적
    start_date: date
    end_date: date
    region: str                 # 제주 지역
    meal_count: int = 3         # 하루 식사 횟수
    tourist_count: int = 3      # 하루 관광지 횟수
    transport: str = "렌터카"
    start_meal: Optional[str] = None   # 첫째 날 시작일정 (예: 조식, 석식). 여행 2일 이상일 때만 의미 있음
    end_meal: Optional[str] = None     # 마지막 날 종료일정 (예: 중식, 야식). 여행 2일 이상일 때만 의미 있음


class GeneratedPlaceItem(BaseModel):
    day: int
    visit_order: int
    place_name: str
    category: str
    time: Optional[str] = None
    stay_minutes: Optional[int] = None
    memo: Optional[str] = None


class EnrichedPlaceItem(GeneratedPlaceItem):
    """AI 생성 장소 + 카카오/TourAPI에서 보강된 실제 업체 정보"""
    address: Optional[str] = None
    road_address: Optional[str] = None
    phone_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    kakao_url: Optional[str] = None


class CourseGenerateResponse(BaseModel):
    title: str
    description: str
    places: List[EnrichedPlaceItem]
