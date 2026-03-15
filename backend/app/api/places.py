from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.place import Place
from app.models.user import User
from app.schemas.place import PlaceCreate, PlaceResponse, PlaceUpdate
from app.services.kakao_local import search_place


class KakaoPlaceResult(BaseModel):
    place_name: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    kakao_url: Optional[str] = None


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


# ── 카카오 로컬 API 장소 검색 ────────────────────────────────────────────────────

@router.get("/kakao/search", response_model=KakaoPlaceResult)
async def kakao_search(
    q: str = Query(..., description="검색할 장소명"),
    category: str = Query("tourist", description="restaurant | dessert | tourist | accommodation | nightfood"),
    region: Optional[str] = Query(None, description="제주 지역명 (예: 서귀포시)"),
):
    """
    카카오 로컬 API로 장소 실시간 검색.
    프론트에서 장소 상세 정보(주소, 전화번호, 좌표)가 필요할 때 사용.
    """
    result = await search_place(q, category, region)
    if not result:
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    return result
