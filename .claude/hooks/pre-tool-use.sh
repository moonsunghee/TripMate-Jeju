#!/bin/bash
# PreToolUse — Inspect or block before any tool runs
# stdout → Claude에게 컨텍스트로 전달됨
# exit 2  → 도구 실행 차단 (Claude Code 규약)

LOG="/Users/daniel/MyDevelopment/TripMate-Jeju/.claude/logs/audit.log"
INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# 감사 로그 (stdout이 아닌 파일에 append)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] PreToolUse | CMD: $(echo "$COMMAND" | head -c 120)" >> "$LOG" 2>/dev/null

# ── 차단 규칙 (exit 2 + stdout으로 Claude에게 이유 전달) ──────────────────

# rm -rf 루트/현재 디렉토리 삭제
if echo "$COMMAND" | grep -qE "rm -rf\s+/\b|rm -rf\s+\.\s*$|rm -rf\s+\.\s"; then
    echo "BLOCKED: rm -rf on root or current directory is not allowed. 구체적인 경로를 지정하세요."
    exit 2
fi

# 파괴적 SQL
if echo "$COMMAND" | grep -qiE "(DROP TABLE|DROP DATABASE|TRUNCATE TABLE)"; then
    echo "BLOCKED: 파괴적 SQL 명령어 감지. 직접 실행이 필요하면 수동으로 수행하세요."
    exit 2
fi

# force push
if echo "$COMMAND" | grep -qE "git push.*(--force|-f)(\s|$)"; then
    echo "BLOCKED: Force push는 자동 실행 금지. 유저에게 직접 확인하세요."
    exit 2
fi

# ── 경고만 (차단 안 함, stdout으로 Claude에게 context 주입) ─────────────────

# 새 npm 패키지 설치
if echo "$COMMAND" | grep -qE "npm install [^-\s]|npm i [^-\s]"; then
    echo "NOTICE: 새 패키지 설치 감지됨 — 유저에게 사전 확인이 필요한 작업입니다."
fi

exit 0
