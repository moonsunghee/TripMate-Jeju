"""
제주 장소 DB 초기 적재 스크립트 (TourAPI → Place 테이블)

사용법:
    cd backend
    python scripts/seed_places.py

필요 환경변수:
    TOUR_API_KEY=<data.go.kr에서 발급한 키>
    DATABASE_URL=<DB 연결 URL, 없으면 SQLite 기본값 사용>

실행 결과:
    - 관광지(tourist) 전체 제주 100개
    - 지역별 관광지 각 50개
    기존에 동일 place_name이 있으면 건너뜀 (중복 방지)
"""

import asyncio
import sys
import os

# backend/ 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, Base, engine
from app.models.place import Place
from app.services.tour_api import fetch_jeju_places, fetch_place_detail

# 초기 적재할 지역 목록
REGIONS = [
    "제주시", "서귀포시", "애월읍", "한림읍",
    "성산읍", "안덕면", "남원읍", "표선읍",
    "구좌읍", "조천읍",
]

# 초기 적재할 카테고리 (관광지만 DB에 사전 구축, 식당/카페는 카카오 실시간)
SEED_CATEGORIES = ["tourist"]


async def seed():
    # 테이블 생성 (없으면)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    total_inserted = 0
    total_skipped = 0

    try:
        for category in SEED_CATEGORIES:
            print(f"\n[{category}] 전체 제주 데이터 수집 중...")

            # 제주 전체 데이터
            places = await fetch_jeju_places(category, region=None, num_of_rows=100)
            inserted, skipped = _upsert_places(db, places, category)
            total_inserted += inserted
            total_skipped += skipped
            print(f"  → 삽입 {inserted}건 / 중복 스킵 {skipped}건")

            # 지역별 데이터
            for region in REGIONS:
                print(f"  [{region}] 수집 중...")
                region_places = await fetch_jeju_places(category, region=region, num_of_rows=50)
                ins, skp = _upsert_places(db, region_places, category, region)
                total_inserted += ins
                total_skipped += skp
                print(f"    → 삽입 {ins}건 / 중복 스킵 {skp}건")

        print(f"\n✅ 완료: 총 {total_inserted}건 삽입 / {total_skipped}건 스킵")

    finally:
        db.close()


def _upsert_places(db, places: list, category: str, region: str = None) -> tuple:
    """Place 테이블에 삽입. 동일 place_name 있으면 스킵."""
    inserted = 0
    skipped = 0

    for p in places:
        name = p.get("place_name", "").strip()
        if not name:
            continue

        exists = db.query(Place).filter(Place.place_name == name).first()
        if exists:
            skipped += 1
            continue

        place = Place(
            place_name=name,
            category=category,
            region=region or p.get("region", "제주"),
            address=p.get("address"),
            phone_number=p.get("phone_number"),
            place_image=p.get("place_image"),
            latitude=p.get("latitude"),
            longitude=p.get("longitude"),
        )
        db.add(place)
        inserted += 1

    db.commit()
    return inserted, skipped


if __name__ == "__main__":
    print("🌿 TripMate-Jeju 장소 DB 초기 적재 시작")
    asyncio.run(seed())
