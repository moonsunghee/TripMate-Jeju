#!/bin/bash
# TripMate-Jeju 배포 전 사전 검증

PROJECT_DIR="/Users/daniel/MyDevelopment/TripMate-Jeju"
FRONTEND_DIR="$PROJECT_DIR/frontend"
EXIT_CODE=0

echo "────────────────────────────────"
echo "  배포 전 사전 검증"
echo "────────────────────────────────"

# 1. 미커밋 변경사항 확인
echo ""
UNCOMMITTED=$(git -C "$PROJECT_DIR" status --short 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "⚠️  미커밋 변경사항 ${UNCOMMITTED}개 — 커밋 후 배포하는 것을 권장합니다"
    git -C "$PROJECT_DIR" status --short
else
    echo "✅ Git 상태 깨끗함"
fi

# 2. .env.local 확인
echo ""
if [ -f "$FRONTEND_DIR/.env.local" ]; then
    echo "✅ frontend/.env.local 존재"
else
    echo "❌ frontend/.env.local 없음 — NEXT_PUBLIC_API_URL 미설정"
    EXIT_CODE=1
fi

# 3. TypeScript 오류 확인
echo ""
echo "TypeScript 체크 중..."
cd "$FRONTEND_DIR" || exit 1
TS_ERRORS=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_ERRORS" -eq 0 ]; then
    echo "✅ TypeScript: 0 errors"
else
    echo "❌ TypeScript: $TS_ERRORS errors — 배포 전 수정 필요"
    EXIT_CODE=1
fi

# 4. CORS 설정 확인 (백엔드 main.py에 vercel URL 포함 여부)
echo ""
VERCEL_URL="tm-jeju.vercel.app"
if grep -q "$VERCEL_URL" "$PROJECT_DIR/backend/main.py" 2>/dev/null; then
    echo "✅ CORS: Vercel URL 등록됨"
else
    echo "⚠️  CORS: backend/main.py에 $VERCEL_URL 미등록 — 확인 필요"
fi

echo ""
echo "────────────────────────────────"
[ $EXIT_CODE -eq 0 ] && echo "✅ 사전 검증 통과 — 배포 진행 가능" || echo "❌ 수정 후 재시도하세요"
echo "────────────────────────────────"

exit $EXIT_CODE
