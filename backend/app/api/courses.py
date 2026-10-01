from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course, CourseLike, CoursePlace
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseGenerateRequest,
    CourseGenerateResponse,
    CourseLikeResponse,
    CourseListItem,
    CourseResponse,
    CourseUpdate,
)
from app.services.ai_course import generate_course

router = APIRouter()


# ── 공개 코스 목록 (게시판) ─────────────────────────────────────────────────────

@router.get("", response_model=List[CourseListItem])
def list_courses(
    region: Optional[str] = Query(None),
    travel_style: Optional[str] = Query(None),
    is_recruiting: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Course).filter(Course.is_shared == True)  # noqa: E712
    if region:
        q = q.filter(Course.region == region)
    if travel_style:
        q = q.filter(Course.travel_style == travel_style)
    if is_recruiting is not None:
        q = q.filter(Course.is_recruiting == is_recruiting)

    total = q.count()
    courses = q.order_by(Course.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return courses


# ── 내 코스 목록 ────────────────────────────────────────────────────────────────

@router.get("/my", response_model=List[CourseListItem])
def my_courses(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Course).filter(Course.user_id == current_user.id)
    if status:
        q = q.filter(Course.status == status)
    return q.order_by(Course.created_at.desc()).all()


# ── 추천 코스 (타인의 공유 코스, 최근 30일 좋아요 순) ──────────────────────────────

@router.get("/recommended", response_model=List[CourseListItem])
def recommended_courses(
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=30)
    recent_likes = (
        db.query(CourseLike.course_id, func.count(CourseLike.id).label("cnt"))
        .filter(CourseLike.created_at >= since)
        .group_by(CourseLike.course_id)
        .subquery()
    )
    return (
        db.query(Course)
        .outerjoin(recent_likes, recent_likes.c.course_id == Course.id)
        .filter(
            Course.is_shared == True,  # noqa: E712
            Course.user_id != current_user.id,
            Course.status.in_(["sharing", "recruiting"]),
        )
        .order_by(func.coalesce(recent_likes.c.cnt, 0).desc(), Course.created_at.desc())
        .limit(size)
        .all()
    )


# ── AI 코스 생성 ────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=CourseGenerateResponse)
async def ai_generate_course(
    body: CourseGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await generate_course(body, db=db)
    return result


# ── 코스 생성 ───────────────────────────────────────────────────────────────────

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    body: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = Course(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        travel_image=body.travel_image,
        duration_days=body.duration_days,
        travel_style=body.travel_style,
        region=body.region,
        transport=body.transport,
        is_shared=body.is_shared,
        is_recruiting=body.is_recruiting,
        status=body.status,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(course)
    db.flush()

    for p in body.places:
        db.add(CoursePlace(course_id=course.id, **p.model_dump()))

    db.commit()
    db.refresh(course)
    return course


# ── 코스 상세 ───────────────────────────────────────────────────────────────────

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    if not course.is_shared:
        raise HTTPException(status_code=403, detail="비공개 코스입니다.")
    return course


@router.get("/{course_id}/detail", response_model=CourseResponse)
def get_my_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    if course.user_id != current_user.id and not course.is_shared:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return course


# ── 좋아요 ─────────────────────────────────────────────────────────────────────

def _get_likeable_course(course_id: int, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    if not course.is_shared:
        raise HTTPException(status_code=403, detail="비공개 코스입니다.")
    return course


def _like_status(course: Course, user: User) -> CourseLikeResponse:
    liked = any(like.user_id == user.id for like in course.likes)
    return CourseLikeResponse(liked=liked, like_count=course.like_count)


@router.get("/{course_id}/like", response_model=CourseLikeResponse)
def get_like(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _like_status(_get_likeable_course(course_id, db), current_user)


@router.post("/{course_id}/like", response_model=CourseLikeResponse)
def like_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_likeable_course(course_id, db)
    if not any(like.user_id == current_user.id for like in course.likes):
        course.likes.append(CourseLike(user_id=current_user.id))
        db.commit()
        db.refresh(course)
    return _like_status(course, current_user)


@router.delete("/{course_id}/like", response_model=CourseLikeResponse)
def unlike_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = _get_likeable_course(course_id, db)
    db.query(CourseLike).filter(
        CourseLike.course_id == course_id, CourseLike.user_id == current_user.id
    ).delete()
    db.commit()
    db.refresh(course)
    return _like_status(course, current_user)


# ── 코스 수정 ───────────────────────────────────────────────────────────────────

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    if course.is_shared or course.is_recruiting:
        raise HTTPException(status_code=403, detail="공유 중이거나 모집 중인 코스는 편집할 수 없습니다.")

    for field, value in body.model_dump(exclude_unset=True, exclude={"places"}).items():
        setattr(course, field, value)

    if body.places is not None:
        db.query(CoursePlace).filter(CoursePlace.course_id == course_id).delete()
        for p in body.places:
            db.add(CoursePlace(course_id=course_id, **p.model_dump()))

    db.commit()
    db.refresh(course)
    return course


# ── 코스 삭제 ───────────────────────────────────────────────────────────────────

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="코스를 찾을 수 없습니다.")
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(course)
    db.commit()
