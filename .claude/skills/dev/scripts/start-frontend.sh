#!/bin/bash
# TripMate-Jeju 프론트엔드 서버 시작

PROJECT_DIR="/Users/daniel/MyDevelopment/TripMate-Jeju"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# .env.local 존재 확인
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "⚠️  frontend/.env.local 없음 — API_URL이 설정되지 않았습니다"
    echo "   기본값: http://localhost:8000"
fi

cd "$FRONTEND_DIR" || exit 1
exec npm run dev
