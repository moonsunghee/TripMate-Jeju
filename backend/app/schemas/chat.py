from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SenderInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]

    model_config = {"from_attributes": True}


# ── Group Chat ─────────────────────────────────────────────────────────────────

class ChatRoomResponse(BaseModel):
    id: int
    post_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    message: str
    created_at: datetime
    user: Optional[SenderInfo]

    model_config = {"from_attributes": True}


# ── Direct Chat ────────────────────────────────────────────────────────────────

class DirectRoomResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    other_user: Optional[SenderInfo] = None

    model_config = {"from_attributes": True}


class DirectMessageCreate(BaseModel):
    message: str


class DirectMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    message: str
    is_read: bool
    created_at: datetime
    sender: Optional[SenderInfo]

    model_config = {"from_attributes": True}
