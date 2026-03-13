from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    travel_image = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=True)
    travel_style = Column(String, nullable=True)   # purpose: 휴식, 등산, 해양레포츠 …
    region = Column(String, nullable=True)
    transport = Column(String, nullable=True)       # 렌터카, 대중교통, 도보
    is_shared = Column(Boolean, default=False)
    is_recruiting = Column(Boolean, default=False)
    # draft / master / sharing / recruiting / completed / discarded
    status = Column(String, default="draft")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="courses")
    course_places = relationship("CoursePlace", back_populates="course", cascade="all, delete-orphan")
    companion_posts = relationship("CompanionPost", back_populates="course")


class CoursePlace(Base):
    __tablename__ = "course_places"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    visit_order = Column(Integer, nullable=False)
    day = Column(Integer, nullable=False, default=1)
    # AI 생성 시 place_id 없이 임시 저장될 수 있으므로 name/category 캐싱
    place_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    time = Column(String, nullable=True)           # 예: "09:00"
    memo = Column(Text, nullable=True)

    course = relationship("Course", back_populates="course_places")
    place = relationship("Place")
