from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatMessage, ChatRoom, DirectChatMessage, DirectChatRoom
from app.models.companion import CompanionJoin
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatRoomResponse,
    DirectMessageCreate,
    DirectMessageResponse,
    DirectRoomResponse,
)

router = APIRouter()


# ── 그룹 채팅 ──────────────────────────────────────────────────────────────────

def _check_group_access(room: ChatRoom, current_user: User, db: Session):
    """채팅방 멤버(작성자 or 승인된 참여자)인지 확인."""
    post = room.post
    if post.user_id == current_user.id:
        return
    join = db.query(CompanionJoin).filter(
        CompanionJoin.post_id == post.id,
        CompanionJoin.user_id == current_user.id,
        CompanionJoin.status == "approved",
    ).first()
    if not join:
        raise HTTPException(status_code=403, detail="채팅방 참여 권한이 없습니다.")


@router.get("/rooms", response_model=List[ChatRoomResponse])
def list_my_group_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내가 참여 중인 그룹 채팅방 목록."""
    # 작성자로 참여 중인 방
    as_host = (
        db.query(ChatRoom)
        .join(ChatRoom.post)
        .filter(ChatRoom.post.has(user_id=current_user.id))
        .all()
    )
    # 승인된 참여자로 참여 중인 방
    approved_post_ids = [
        j.post_id
        for j in db.query(CompanionJoin).filter(
            CompanionJoin.user_id == current_user.id,
            CompanionJoin.status == "approved",
        ).all()
    ]
    as_member = db.query(ChatRoom).filter(ChatRoom.post_id.in_(approved_post_ids)).all()

    seen = set()
    result = []
    for room in as_host + as_member:
        if room.id not in seen:
            seen.add(room.id)
            result.append(room)
    return result


@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageResponse])
def get_group_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
    _check_group_access(room, current_user, db)
    return room.messages


@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_group_message(
    room_id: int,
    body: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
    _check_group_access(room, current_user, db)

    msg = ChatMessage(room_id=room_id, user_id=current_user.id, message=body.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ── 1:1 다이렉트 채팅 ─────────────────────────────────────────────────────────

@router.get("/direct", response_model=List[DirectRoomResponse])
def list_direct_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rooms = db.query(DirectChatRoom).filter(
        or_(
            DirectChatRoom.user1_id == current_user.id,
            DirectChatRoom.user2_id == current_user.id,
        )
    ).all()

    result = []
    for room in rooms:
        other = room.user2 if room.user1_id == current_user.id else room.user1
        response = DirectRoomResponse.model_validate(room)
        response.other_user = other
        result.append(response)
    return result


@router.post("/direct/{target_user_id}", response_model=DirectRoomResponse, status_code=status.HTTP_201_CREATED)
def get_or_create_direct_room(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자신과 채팅할 수 없습니다.")

    target = db.query(User).filter(User.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    u1, u2 = sorted([current_user.id, target_user_id])
    room = db.query(DirectChatRoom).filter(
        and_(DirectChatRoom.user1_id == u1, DirectChatRoom.user2_id == u2)
    ).first()

    if not room:
        room = DirectChatRoom(user1_id=u1, user2_id=u2)
        db.add(room)
        db.commit()
        db.refresh(room)

    other = target if room.user1_id == current_user.id else db.query(User).filter(User.id == room.user1_id).first()
    response = DirectRoomResponse.model_validate(room)
    response.other_user = other
    return response


@router.get("/direct/{room_id}/messages", response_model=List[DirectMessageResponse])
def get_direct_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(DirectChatRoom).filter(DirectChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
    if current_user.id not in (room.user1_id, room.user2_id):
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    # 읽음 처리
    db.query(DirectChatMessage).filter(
        DirectChatMessage.room_id == room_id,
        DirectChatMessage.sender_id != current_user.id,
        DirectChatMessage.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()

    return room.messages


@router.post("/direct/{room_id}/messages", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
def send_direct_message(
    room_id: int,
    body: DirectMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(DirectChatRoom).filter(DirectChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="채팅방을 찾을 수 없습니다.")
    if current_user.id not in (room.user1_id, room.user2_id):
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    msg = DirectChatMessage(room_id=room_id, sender_id=current_user.id, message=body.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
