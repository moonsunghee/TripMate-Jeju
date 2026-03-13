from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.db.session import Base


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    place_name = Column(String, nullable=False, index=True)
    # restaurant / tourist / accommodation / dessert / nightfood
    category = Column(String, nullable=False)
    region = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    place_image = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
