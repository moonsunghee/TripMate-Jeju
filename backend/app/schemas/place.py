from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PlaceCreate(BaseModel):
    place_name: str
    category: str
    region: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    place_image: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class PlaceUpdate(BaseModel):
    place_name: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    place_image: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class PlaceResponse(BaseModel):
    id: int
    place_name: str
    category: str
    region: Optional[str]
    address: Optional[str]
    phone_number: Optional[str]
    place_image: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
