#!/bin/bash
# SubagentStop — Run when a subagent returns
# stdout → 서브에이전트 결과를 메인 컨텍스트에 주입

LOG="/Users/daniel/MyDevelopment/TripMate-Jeju/.claude/logs/audit.log"
INPUT=$(cat)

AGENT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # 에이전트 이름 추출 (가능한 경우)
    print(data.get('agent_name', data.get('subagent_type', 'unknown')))
except:
    print('unknown')
" 2>/dev/null)

# 서브에이전트 완료 로그
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SubagentStop | AGENT: $AGENT" >> "$LOG" 2>/dev/null

# 메인 Claude에게 컨텍스트 주입
echo "SUBAGENT_DONE: $AGENT 에이전트 작업 완료. 결과를 검토하고 다음 단계를 진행하세요."

exit 0
