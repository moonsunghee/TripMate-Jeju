from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.course import Course, CoursePlace
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseGenerateRequest,
    CourseGenerateResponse,
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


# ── AI 코스 생성 ────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=CourseGenerateResponse)
async def ai_generate_course(
    body: CourseGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    result = await generate_course(body)
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
        db.add(CoursePlace(
            course_id=course.id,
            place_id=p.place_id,
            visit_order=p.visit_order,
            day=p.day,
            place_name=p.place_name,
            category=p.category,
            time=p.time,
            memo=p.memo,
        ))

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

    for field, value in body.model_dump(exclude_unset=True, exclude={"places"}).items():
        setattr(course, field, value)

    if body.places is not None:
        db.query(CoursePlace).filter(CoursePlace.course_id == course_id).delete()
        for p in body.places:
            db.add(CoursePlace(
                course_id=course_id,
                place_id=p.place_id,
                visit_order=p.visit_order,
                day=p.day,
                place_name=p.place_name,
                category=p.category,
                time=p.time,
                memo=p.memo,
            ))

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
