# 배포 전 최종 체크리스트

## 코드
- [ ] TypeScript 오류 없음
- [ ] ESLint 오류 없음
- [ ] 콘솔 로그 / 디버그 코드 제거됨

## 환경 설정
- [ ] Vercel 대시보드에 환경 변수 설정됨
  - `NEXT_PUBLIC_API_URL` → Railway 백엔드 URL
- [ ] backend/main.py CORS에 Vercel URL 포함됨

## 기능 검증 (배포 후)
- [ ] 로그인 (일반 + 게스트) 동작
- [ ] AI 코스 생성 플로우 완료
- [ ] 게시판 목록 로딩
- [ ] 채팅 방 입장
- [ ] 모바일 430px 레이아웃 정상

## 배포 정보
- URL: https://tm-jeju.vercel.app
- 플랫폼: Vercel (프론트엔드)
- 백엔드: Railway (별도 배포)
