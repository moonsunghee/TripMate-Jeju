---
description: Vercel 배포 전 검증 및 배포 실행. "배포", "vercel 올려줘", "프로덕션 배포", "deploy" 요청 시 자동 매칭
---

# deploy — Vercel 배포

## 1단계: 사전 검증
```bash
bash .claude/skills/deploy/scripts/pre-deploy.sh
```
검증 실패 시 배포 중단, 유저에게 원인 보고

## 2단계: 배포 확인 요청
`templates/deploy-checklist.md`를 유저에게 보여주고 최종 확인

## 3단계: 배포 실행
```bash
cd frontend && vercel --prod
```

## 4단계: 배포 후 검증
- 배포 URL에서 로그인 → 코스 생성 플로우 확인 요청
- CORS 오류 없는지 확인 (프론트 ↔ Railway 백엔드)
