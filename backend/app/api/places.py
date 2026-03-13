from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.place import Place
from app.models.user import User
from app.schemas.place import PlaceCreate, PlaceResponse, PlaceUpdate

router = APIRouter()


@router.get("", response_model=List[PlaceResponse])
def list_places(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="장소명 검색"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Place)
    if category:
        query = query.filter(Place.category == category)
    if region:
        query = query.filter(Place.region == region)
    if q:
        query = query.filter(Place.place_name.ilike(f"%{q}%"))
    return query.order_by(Place.place_name).offset((page - 1) * size).limit(size).all()


@router.post("", response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
def create_place(
    body: PlaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    place = Place(**body.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.get("/{place_id}", response_model=PlaceResponse)
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    return place


@router.put("/{place_id}", response_model=PlaceResponse)
def update_place(
    place_id: int,
    body: PlaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(place, field, value)
    db.commit()
    db.refresh(place)
    return place


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    db.delete(place)
    db.commit()
