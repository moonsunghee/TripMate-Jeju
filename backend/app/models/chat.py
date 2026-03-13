from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("companion_posts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("CompanionPost", back_populates="chat_room")
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("User")


class DirectChatRoom(Base):
    __tablename__ = "direct_chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("DirectChatMessage", back_populates="room", cascade="all, delete-orphan")


class DirectChatMessage(Base):
    __tablename__ = "direct_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("direct_chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("DirectChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
