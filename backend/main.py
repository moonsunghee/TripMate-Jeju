from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api import auth, chat, comments, companion, courses, oauth, places
from app.db.session import Base, engine
from app.models import chat as _chat_model            # noqa: F401
from app.models import comment as _comment_model      # noqa: F401
from app.models import companion as _companion_model  # noqa: F401
from app.models import course as _course_model        # noqa: F401
from app.models import place as _place_model          # noqa: F401
from app.models import user as _user_model            # noqa: F401

# DB 테이블 자동 생성 (개발용)
Base.metadata.create_all(bind=engine)

# create_all은 기존 테이블에 컬럼을 추가하지 않으므로 신규 컬럼만 보강
_ADDED_COLUMNS = {
    "companion_posts": {
        "recruit_deadline": "DATE",
        "gender": "VARCHAR DEFAULT 'any'",
        "age_groups": "JSON",
    },
    "places": {
        "road_address": "VARCHAR",
    },
    "course_places": {
        "stay_minutes": "INTEGER",
        "address": "VARCHAR",
        "road_address": "VARCHAR",
    },
}


def _backfill_stay_minutes(conn) -> None:
    # 체류 시간 컬럼이 처음 생길 때만: 같은 날 다음 장소 방문 시각과의 차이로 채움
    rows = conn.execute(text(
        "SELECT id, course_id, day, visit_order, time FROM course_places ORDER BY course_id, day, visit_order"
    )).fetchall()

    def to_min(t):
        try:
            h, m = str(t).split(":")[:2]
            return int(h) * 60 + int(m)
        except (ValueError, AttributeError):
            return None

    for cur, nxt in zip(rows, rows[1:]):
        if (cur.course_id, cur.day) != (nxt.course_id, nxt.day):
            continue
        start, end = to_min(cur.time), to_min(nxt.time)
        if start is not None and end is not None and end > start:
            conn.execute(text("UPDATE course_places SET stay_minutes = :m WHERE id = :id"), {"m": end - start, "id": cur.id})


with engine.begin() as _conn:
    _inspector = inspect(_conn)
    for _table, _columns in _ADDED_COLUMNS.items():
        _existing = {c["name"] for c in _inspector.get_columns(_table)}
        for _name, _ddl in _columns.items():
            if _name not in _existing:
                _conn.execute(text(f"ALTER TABLE {_table} ADD COLUMN {_name} {_ddl}"))
                if (_table, _name) == ("course_places", "stay_minutes"):
                    _backfill_stay_minutes(_conn)
    # 임시저장(draft) 상태 폐지 — 기존 데이터는 나만보기로 통합
    _conn.execute(text("UPDATE courses SET status = 'master' WHERE status = 'draft'"))

app = FastAPI(title="TripMate-Jeju API", version="0.1.0")

from app.core.config import settings

_origins = ["http://localhost:3000", "http://192.168.0.5:3000", "https://tm-jeju.vercel.app"]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in _origins:
    _origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(oauth.router,     prefix="/api/auth",      tags=["oauth"])
app.include_router(courses.router,   prefix="/api/courses",   tags=["courses"])
app.include_router(companion.router, prefix="/api/companion", tags=["companion"])
app.include_router(comments.router,  prefix="/api/companion", tags=["comments"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["chat"])
app.include_router(places.router,    prefix="/api/places",    tags=["places"])


@app.get("/")
def root():
    return {"message": "TripMate-Jeju API", "version": "0.1.0"}
