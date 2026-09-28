from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CompanionPost(Base):
    __tablename__ = "companion_posts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    max_people = Column(Integer, nullable=False, default=4)
    # recruiting / completed
    status = Column(String, default="recruiting")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    recruit_deadline = Column(Date, nullable=True)
    # any / male / female
    gender = Column(String, default="any", server_default="any")
    # ["20s", "30s", "40s", "50s+"] — 비어 있으면 연령 무관
    age_groups = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="companion_posts")
    user = relationship("User")
    joins = relationship("CompanionJoin", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    chat_room = relationship("ChatRoom", back_populates="post", uselist=False, cascade="all, delete-orphan")

    @property
    def like_count(self):
        return self.course.like_count if self.course else 0


class CompanionJoin(Base):
    __tablename__ = "companion_joins"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("companion_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # pending / approved / rejected
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("CompanionPost", back_populates="joins")
    user = relationship("User")
