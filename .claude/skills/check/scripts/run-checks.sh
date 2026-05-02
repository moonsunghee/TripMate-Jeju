#!/bin/bash
# TripMate-Jeju 코드 품질 검사

FRONTEND_DIR="/Users/daniel/MyDevelopment/TripMate-Jeju/frontend"
EXIT_CODE=0

cd "$FRONTEND_DIR" || exit 1

echo "────────────────────────────────"
echo "  TripMate-Jeju 코드 품질 검사"
echo "────────────────────────────────"

# 1. TypeScript 타입 체크
echo ""
echo "1️⃣  TypeScript 타입 체크..."
TS_OUTPUT=$(npx tsc --noEmit --skipLibCheck 2>&1)
TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")

if [ "$TS_ERRORS" -eq 0 ]; then
    echo "   ✅ TypeScript: 0 errors"
else
    echo "   ❌ TypeScript: $TS_ERRORS errors"
    echo "$TS_OUTPUT" | grep "error TS" | head -10
    EXIT_CODE=1
fi

# 2. ESLint
echo ""
echo "2️⃣  ESLint..."
LINT_OUTPUT=$(npm run lint 2>&1)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "Error:" || echo "0")
LINT_WARNS=$(echo "$LINT_OUTPUT" | grep -c "Warning:" || echo "0")

if [ "$LINT_ERRORS" -eq 0 ]; then
    echo "   ✅ ESLint: 0 errors ($LINT_WARNS warnings)"
else
    echo "   ❌ ESLint: $LINT_ERRORS errors ($LINT_WARNS warnings)"
    echo "$LINT_OUTPUT" | grep "Error:" | head -10
    EXIT_CODE=1
fi

# 3. 빌드 (--fast 옵션으로 타입체크 스킵하여 속도 향상)
echo ""
echo "3️⃣  Next.js 빌드..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "   ✅ Build: success"
else
    echo "   ❌ Build: failed"
    echo "$BUILD_OUTPUT" | tail -20
    EXIT_CODE=1
fi

echo ""
echo "────────────────────────────────"
[ $EXIT_CODE -eq 0 ] && echo "✅ 모든 검사 통과" || echo "❌ 수정 필요 항목 있음"
echo "────────────────────────────────"

exit $EXIT_CODE
