from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

Gender = Literal["any", "male", "female"]
AgeGroup = Literal["20s", "30s", "40s", "50s+"]


class AuthorInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]

    model_config = {"from_attributes": True}


# ── CompanionPost ──────────────────────────────────────────────────────────────

class CompanionPostCreate(BaseModel):
    course_id: int
    title: str = Field(min_length=1)
    content: Optional[str] = None
    max_people: int = Field(4, ge=2, le=10)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recruit_deadline: Optional[date] = None
    gender: Gender = "any"
    age_groups: List[AgeGroup] = []


class CompanionPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = None
    max_people: Optional[int] = Field(None, ge=2, le=10)
    status: Optional[Literal["recruiting", "completed"]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recruit_deadline: Optional[date] = None
    gender: Optional[Gender] = None
    age_groups: Optional[List[AgeGroup]] = None


class CompanionPostResponse(BaseModel):
    id: int
    course_id: int
    user_id: int
    title: str
    content: Optional[str]
    max_people: int
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    recruit_deadline: Optional[date] = None
    gender: str = "any"
    age_groups: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[AuthorInfo]
    current_people: int = 0
    like_count: int = 0

    model_config = {"from_attributes": True}

    @field_validator("age_groups", mode="before")
    @classmethod
    def _null_age_groups(cls, v):
        return v or []


class CompanionPostListItem(BaseModel):
    id: int
    course_id: int
    user_id: int
    title: str
    max_people: int
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    recruit_deadline: Optional[date] = None
    gender: str = "any"
    age_groups: List[str] = []
    created_at: datetime
    user: Optional[AuthorInfo]
    current_people: int = 0
    like_count: int = 0

    model_config = {"from_attributes": True}

    @field_validator("age_groups", mode="before")
    @classmethod
    def _null_age_groups(cls, v):
        return v or []


# ── CompanionJoin ──────────────────────────────────────────────────────────────

class JoinResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    status: str
    created_at: datetime
    user: Optional[AuthorInfo]

    model_config = {"from_attributes": True}


class JoinStatusUpdate(BaseModel):
    status: str  # approved / rejected
