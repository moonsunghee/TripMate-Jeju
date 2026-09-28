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
}
with engine.begin() as _conn:
    _inspector = inspect(_conn)
    for _table, _columns in _ADDED_COLUMNS.items():
        _existing = {c["name"] for c in _inspector.get_columns(_table)}
        for _name, _ddl in _columns.items():
            if _name not in _existing:
                _conn.execute(text(f"ALTER TABLE {_table} ADD COLUMN {_name} {_ddl}"))
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
