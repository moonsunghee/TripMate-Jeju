from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatRoom
from app.models.companion import CompanionJoin, CompanionPost
from app.models.course import Course
from app.models.user import User
from app.schemas.companion import (
    CompanionPostCreate,
    CompanionPostListItem,
    CompanionPostResponse,
    CompanionPostUpdate,
    JoinResponse,
    JoinStatusUpdate,
)
from app.schemas.course import CourseResponse

router = APIRouter()


# ── 게시글에 연결된 코스 조회 (공개용) ──────────────────────────────────────────

@router.get("/{post_id}/course", response_model=CourseResponse)
def get_companion_course(post_id: int, db: Session = Depends(get_db)):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    course = db.query(Course).filter(Course.id == post.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="연결된 코스를 찾을 수 없습니다.")
    return course


def _with_people(post: CompanionPost) -> dict:
    data = {c.name: getattr(post, c.name) for c in post.__table__.columns}
    data["user"] = post.user
    approved = [j for j in post.joins if j.status == "approved"]
    data["current_people"] = len(approved) + 1  # 작성자 포함
    return data


# ── 게시글 목록 ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CompanionPostListItem])
def list_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(CompanionPost)
    if status_filter:
        q = q.filter(CompanionPost.status == status_filter)

    posts = q.order_by(CompanionPost.created_at.desc()).offset((page - 1) * size).limit(size).all()

    result = []
    for post in posts:
        approved_count = sum(1 for j in post.joins if j.status == "approved")
        item = CompanionPostListItem.model_validate(post)
        item.current_people = approved_count + 1
        result.append(item)
    return result


# ── 게시글 생성 ─────────────────────────────────────────────────────────────────

@router.post("", response_model=CompanionPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    body: CompanionPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = CompanionPost(
        course_id=body.course_id,
        user_id=current_user.id,
        title=body.title,
        content=body.content,
        max_people=body.max_people,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    response = CompanionPostResponse.model_validate(post)
    response.current_people = 1
    return response


# ── 게시글 상세 ─────────────────────────────────────────────────────────────────

@router.get("/{post_id}", response_model=CompanionPostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    approved_count = sum(1 for j in post.joins if j.status == "approved")
    response = CompanionPostResponse.model_validate(post)
    response.current_people = approved_count + 1
    return response


# ── 게시글 수정 ─────────────────────────────────────────────────────────────────

@router.put("/{post_id}", response_model=CompanionPostResponse)
def update_post(
    post_id: int,
    body: CompanionPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    approved_count = sum(1 for j in post.joins if j.status == "approved")
    response = CompanionPostResponse.model_validate(post)
    response.current_people = approved_count + 1
    return response


# ── 게시글 삭제 ─────────────────────────────────────────────────────────────────

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(post)
    db.commit()


# ── 동행 신청 ───────────────────────────────────────────────────────────────────

@router.post("/{post_id}/join", response_model=JoinResponse, status_code=status.HTTP_201_CREATED)
def join_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.status != "recruiting":
        raise HTTPException(status_code=400, detail="모집이 마감된 게시글입니다.")
    if post.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="본인 게시글에는 신청할 수 없습니다.")

    existing = db.query(CompanionJoin).filter(
        CompanionJoin.post_id == post_id,
        CompanionJoin.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 신청한 게시글입니다.")

    join = CompanionJoin(post_id=post_id, user_id=current_user.id)
    db.add(join)
    db.commit()
    db.refresh(join)
    return join


# ── 신청 목록 조회 (작성자) ──────────────────────────────────────────────────────

@router.get("/{post_id}/joins", response_model=List[JoinResponse])
def list_joins(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="조회 권한이 없습니다.")
    return post.joins


# ── 신청 승인/거절 (작성자) ──────────────────────────────────────────────────────

@router.put("/{post_id}/joins/{join_id}", response_model=JoinResponse)
def update_join_status(
    post_id: int,
    join_id: int,
    body: JoinStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    join = db.query(CompanionJoin).filter(
        CompanionJoin.id == join_id,
        CompanionJoin.post_id == post_id,
    ).first()
    if not join:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다.")

    if body.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status는 approved 또는 rejected만 가능합니다.")

    join.status = body.status
    db.commit()
    db.refresh(join)
    return join


# ── 모집 완료 → 채팅방 자동 생성 ────────────────────────────────────────────────

@router.post("/{post_id}/complete", response_model=CompanionPostResponse)
def complete_recruiting(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    if post.status == "completed":
        raise HTTPException(status_code=400, detail="이미 모집이 완료된 게시글입니다.")

    post.status = "completed"

    # 채팅방이 없으면 자동 생성
    if not post.chat_room:
        db.add(ChatRoom(post_id=post_id))

    db.commit()
    db.refresh(post)
    approved_count = sum(1 for j in post.joins if j.status == "approved")
    response = CompanionPostResponse.model_validate(post)
    response.current_people = approved_count + 1
    return response
