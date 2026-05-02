#!/bin/bash
# TripMate-Jeju 백엔드 서버 시작

PROJECT_DIR="/Users/daniel/MyDevelopment/TripMate-Jeju"
BACKEND_DIR="$PROJECT_DIR/backend"

# .env 존재 확인
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  backend/.env 없음 — AI 기능은 샘플 데이터로 동작합니다"
fi

# venv 활성화 후 서버 시작
cd "$BACKEND_DIR" || exit 1
source .venv/bin/activate
exec uvicorn main:app --reload --port 8000
