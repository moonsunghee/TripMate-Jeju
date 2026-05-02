#!/bin/bash
# SessionStart hook — 세션 시작 시 프로젝트 현황 표시

PROJECT_DIR="/Users/daniel/MyDevelopment/TripMate-Jeju"

echo ""
echo "🗺️  TripMate-Jeju 프로젝트"
echo "──────────────────────────────"

# Git 상태
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "N/A")
MODIFIED=$(git -C "$PROJECT_DIR" status --short 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git -C "$PROJECT_DIR" rev-list @{u}..HEAD --count 2>/dev/null || echo "0")

echo "📌 Branch : $BRANCH"
echo "📝 Modified: ${MODIFIED}개 파일"
[ "$AHEAD" -gt "0" ] && echo "🚀 Push 대기: ${AHEAD}개 커밋"

# 최근 커밋
LAST_COMMIT=$(git -C "$PROJECT_DIR" log --oneline -1 2>/dev/null || echo "N/A")
echo "💾 Last commit: $LAST_COMMIT"

echo "──────────────────────────────"
echo "💡 Skills: /dev  /check  /deploy"
echo ""

exit 0
