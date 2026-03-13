from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app = FastAPI(title="TripMate-Jeju API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tm-jeju.vercel.app"],
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
