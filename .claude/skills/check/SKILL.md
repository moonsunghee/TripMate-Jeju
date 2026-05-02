---
description: TypeScript 타입 오류, ESLint, 빌드 검사 실행. "타입 체크", "lint", "코드 검사", "빌드 확인", "오류 확인" 요청 시 자동 매칭
---

# check — 코드 품질 검사

`scripts/run-checks.sh`를 실행하세요.

```bash
bash .claude/skills/check/scripts/run-checks.sh
```

## 결과 처리
- **TypeScript 오류**: 즉시 수정 후 재검사
- **ESLint 오류**: `--fix` 자동 수정 시도, 수동 수정 필요 항목은 목록 제시
- **빌드 실패**: 오류 메시지 분석 후 수정 방안 제안
- **경고(warning)**: 유저에게 확인 후 처리 여부 결정

## 출력 형식
```
TypeScript: ✅ 0 errors  /  ❌ N errors
ESLint:     ✅ 0 errors  /  ❌ N errors  (N warnings)
Build:      ✅ success   /  ❌ failed
```
