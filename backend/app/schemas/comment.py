from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuthorInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[AuthorInfo]

    model_config = {"from_attributes": True}
