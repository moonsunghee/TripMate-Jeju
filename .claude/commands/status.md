---
description: 프로젝트 전체 상태를 한눈에 보여줍니다 — git, 서버, 환경변수, 최근 변경
---

# /status

TripMate-Jeju 프로젝트 현황을 종합 보고합니다.

## 확인 항목

1. **Git 상태**
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -3
   ```

2. **서버 상태**
   ```bash
   curl -sf http://localhost:8000/docs > /dev/null && echo "백엔드: 실행 중" || echo "백엔드: 중지됨"
   curl -sf http://localhost:3000 > /dev/null && echo "프론트엔드: 실행 중" || echo "프론트엔드: 중지됨"
   ```

3. **환경 변수 체크**
   - `frontend/.env.local` 존재 여부
   - `backend/.env` 존재 여부 + `OPENAI_API_KEY` 설정 여부

4. **최근 감사 로그** (마지막 5줄)
   ```bash
   tail -5 .claude/logs/audit.log 2>/dev/null || echo "로그 없음"
   ```

## 출력 형식
```
## TripMate-Jeju 프로젝트 상태

브랜치: main | 변경: N개 파일
백엔드: 실행 중 / 중지됨
프론트엔드: 실행 중 / 중지됨
환경변수: ✅ / ⚠️ 미설정 항목 있음
최근 커밋: [메시지]
```
