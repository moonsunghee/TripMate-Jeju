from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.comment import Comment
from app.models.companion import CompanionPost
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter()


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(CompanionPost).filter(CompanionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

    comment = Comment(user_id=current_user.id, post_id=post_id, content=body.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/{post_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    post_id: int,
    comment_id: int,
    body: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.post_id == post_id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    comment.content = body.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.post_id == post_id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    db.delete(comment)
    db.commit()
