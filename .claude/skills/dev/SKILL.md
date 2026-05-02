---
description: TripMate-Jeju 개발 서버 시작. "서버 켜줘", "dev 서버", "개발 환경 시작", "백엔드/프론트엔드 실행" 요청 시 자동 매칭
---

# dev — 개발 서버 시작

`scripts/start-backend.sh`와 `scripts/start-frontend.sh`를 순서대로 실행하세요.

## 실행 순서

1. **백엔드 먼저** (포트 8000):
   ```bash
   bash .claude/skills/dev/scripts/start-backend.sh
   ```
   백그라운드로 실행 (`run_in_background: true`)

2. **프론트엔드** (포트 3000):
   ```bash
   bash .claude/skills/dev/scripts/start-frontend.sh
   ```

## 기동 확인
- 백엔드: http://localhost:8000/docs
- 프론트엔드: http://localhost:3000

## 주의
- `backend/.env` 없으면 AI 기능은 샘플 데이터로 동작
- 포트 충돌 시: `lsof -ti:8000 | xargs kill -9`
