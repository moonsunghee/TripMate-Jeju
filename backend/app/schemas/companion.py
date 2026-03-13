from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class AuthorInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]

    model_config = {"from_attributes": True}


# ── CompanionPost ──────────────────────────────────────────────────────────────

class CompanionPostCreate(BaseModel):
    course_id: int
    title: str
    content: Optional[str] = None
    max_people: int = 4
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CompanionPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    max_people: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


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
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[AuthorInfo]
    current_people: int = 0

    model_config = {"from_attributes": True}


class CompanionPostListItem(BaseModel):
    id: int
    course_id: int
    user_id: int
    title: str
    max_people: int
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    user: Optional[AuthorInfo]
    current_people: int = 0

    model_config = {"from_attributes": True}


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
