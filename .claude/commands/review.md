---
description: 현재 변경된 코드를 code-reviewer 에이전트로 즉시 리뷰합니다
---

# /review

`code-reviewer` 에이전트를 호출하여 현재 브랜치의 변경 사항을 리뷰합니다.

## 실행 방식

1. `git diff --name-only HEAD` 로 변경 파일 목록 파악
2. `code-reviewer` 에이전트에 위임:
   > "다음 변경 파일들을 TripMate-Jeju 컨벤션 기준으로 리뷰해줘: [파일 목록]"
3. 에이전트 결과를 그대로 반환

인자를 넘길 경우 (`/review frontend/app/home/page.tsx`) 해당 파일만 리뷰합니다.
