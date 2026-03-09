from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.db.session import Base, engine
from app.models import user as _user_model  # noqa: F401 — ensure model is registered

# DB 테이블 자동 생성 (개발용)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TripMate-Jeju API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.get("/")
def root():
    return {"message": "TripMate-Jeju API"}
