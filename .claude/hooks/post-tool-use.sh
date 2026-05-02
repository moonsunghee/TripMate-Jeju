#!/bin/bash
# PostToolUse — Lint, log, or inject context after tool runs
# stdout → Claude에게 컨텍스트로 주입됨

LOG="/Users/daniel/MyDevelopment/TripMate-Jeju/.claude/logs/audit.log"
INPUT=$(cat)

FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

TOOL=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_name', ''))
except:
    print('')
" 2>/dev/null)

# 감사 로그
echo "[$(date '+%Y-%m-%d %H:%M:%S')] PostToolUse | TOOL: $TOOL | FILE: $FILE" >> "$LOG" 2>/dev/null

# TypeScript 파일 수정 시 — 빠른 구문 체크만 (tsc 전체 실행 금지, 너무 느림)
if echo "$FILE" | grep -qE "\.(tsx?|ts)$" && ! echo "$FILE" | grep -q "\.d\.ts$"; then
    # node --check 으로 JS 구문만 빠르게 확인 (~50ms)
    if command -v node &>/dev/null; then
        SYNTAX_ERR=$(node --check "$FILE" 2>&1)
        if [ -n "$SYNTAX_ERR" ]; then
            echo "NOTICE: $FILE 구문 오류 감지 → $SYNTAX_ERR"
        fi
    fi
fi

# SCSS 변수 파일 수정 시 경고
if echo "$FILE" | grep -qE "_variables\.scss|_mixins\.scss"; then
    echo "NOTICE: 공유 SCSS 파일($FILE) 수정됨 — 전체 스타일 영향도 확인 필요"
fi

# 환경 변수 파일 수정 시 경고
if echo "$FILE" | grep -qE "\.env|\.env\.local"; then
    echo "NOTICE: 환경 변수 파일 수정됨 — git에 커밋되지 않도록 .gitignore 확인"
fi

exit 0
