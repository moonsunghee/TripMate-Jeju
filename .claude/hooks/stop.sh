#!/bin/bash
# Stop — Run when Claude finishes a turn

LOG="/Users/daniel/MyDevelopment/TripMate-Jeju/.claude/logs/audit.log"

# 턴 완료 감사 로그
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stop | Claude turn completed" >> "$LOG" 2>/dev/null

# 완료 사운드 (비동기, 실패해도 무시)
afplay /System/Library/Sounds/Funk.aiff 2>/dev/null &

exit 0
