"""
SQLite(tripmate.db) → PostgreSQL 데이터 이전 스크립트 (개발용, 1회 실행)

사용법:
    cd backend
    # 1) .env 의 DATABASE_URL 을 NAS PostgreSQL 주소로 바꾼 뒤
    # 2) 실행
    python scripts/sqlite_to_postgres.py

동작:
    - PostgreSQL에 테이블이 없으면 모델 기준으로 생성
    - 외래키 순서대로 테이블 데이터를 복사 (이미 데이터가 있는 테이블은 건너뜀)
    - id 시퀀스를 마지막 값 다음으로 맞춤 (이후 INSERT 시 id 충돌 방지)

옵션:
    SQLITE_URL 환경변수로 원본 위치 변경 가능 (기본값: sqlite:///./tripmate.db)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import MetaData, create_engine, func, select, text  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.db.session import Base, engine as pg_engine  # noqa: E402

# 모든 모델을 등록해야 Base.metadata 에 테이블이 잡힘
from app.models import chat, comment, companion, course, place, user  # noqa: E402,F401

SQLITE_URL = os.getenv("SQLITE_URL", "sqlite:///./tripmate.db")


def main() -> None:
    if not settings.DATABASE_URL.startswith("postgresql"):
        sys.exit("DATABASE_URL 이 PostgreSQL 주소가 아닙니다. backend/.env 를 먼저 바꿔 주세요.")

    src_engine = create_engine(SQLITE_URL)
    src_meta = MetaData()
    src_meta.reflect(bind=src_engine)

    Base.metadata.create_all(bind=pg_engine)

    with src_engine.connect() as src, pg_engine.begin() as dst:
        for table in Base.metadata.sorted_tables:  # 외래키 의존 순서
            name = table.name
            if name not in src_meta.tables:
                print(f"- {name}: SQLite에 없음, 건너뜀")
                continue

            existing = dst.execute(select(func.count()).select_from(table)).scalar()
            if existing:
                print(f"- {name}: PostgreSQL에 이미 {existing}행 있음, 건너뜀")
                continue

            src_cols = {c.name for c in src_meta.tables[name].columns}
            cols = [c for c in table.columns if c.name in src_cols]
            # 모델 타입으로 읽어서 날짜/JSON 등을 올바르게 변환
            rows = [dict(r._mapping) for r in src.execute(select(*cols).select_from(table))]
            if rows:
                dst.execute(table.insert(), rows)

            if "id" in table.c and table.c.id.primary_key:
                dst.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{name}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM \"{name}\"), 0) + 1, false)"
                ))
            print(f"- {name}: {len(rows)}행 복사")

    print("완료")


if __name__ == "__main__":
    main()
