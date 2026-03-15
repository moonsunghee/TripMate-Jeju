# TripMate-Jeju 할 일 목록

> 마지막 업데이트: 2026-03-16
> 상태 표기: ✅ 완료 / 🔄 진행중 / ⏳ 대기

---

## 1단계 — API 키 발급 (개발 시작 전 필수)

- [ ] **OpenAI API 키 발급** — https://platform.openai.com
  - `.env` → `OPENAI_API_KEY=`
  - AI 코스 생성 기능에 필요

- [ ] **카카오 REST API 키 확인** — https://developers.kakao.com
  - 기존 소셜 로그인 앱과 동일한 앱에서 발급
  - `.env` → `KAKAO_REST_API_KEY=`
  - 장소 검색(카카오 로컬 API)에 사용

- [ ] **한국관광공사 TourAPI 키 발급** — https://www.data.go.kr
  - "TourAPI 4.0" 검색 → 활용 신청
  - `.env` → `TOUR_API_KEY=`
  - 제주 관광지 DB 초기 적재에 사용

- [ ] **카카오 지도 JavaScript 키 확인**
  - 카카오 개발자 콘솔 → 앱 키 → JavaScript 키
  - `frontend/.env.local` → `NEXT_PUBLIC_KAKAO_MAP_KEY=`

- [ ] **소셜 로그인 키 발급** (PLANNING.md 가이드 참고)
  - [ ] 카카오: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
  - [ ] 네이버: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
  - [ ] 구글: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## 2단계 — 백엔드 개발 완성

- [ ] **백엔드 API 구현 확인** — Swagger(`/docs`)에서 전체 엔드포인트 테스트
  - [ ] 인증 (회원가입 / 로그인 / 소셜 로그인)
  - [ ] 코스 CRUD + AI 코스 생성
  - [ ] 동행 모집 게시판
  - [ ] 채팅 (그룹 + 1:1)
  - [ ] 댓글
  - [ ] 장소 검색 (카카오 로컬 API 연동)

- [ ] **관광지 DB 초기 적재 (1회 실행)**
  ```bash
  cd backend
  python scripts/seed_places.py
  ```

---

## 3단계 — 프론트엔드 개발 완성 (Next.js)

- [ ] 로그인 / 회원가입 화면
- [ ] 홈 (마이페이지)
- [ ] 코스 게시판
- [ ] AI 코스 설계 플로우 (7단계)
- [ ] 내 코스 목록 (상태 배지)
- [ ] 코스 / 동행 게시글 상세
- [ ] 채팅 목록 + 채팅방

---

## 4단계 — 백엔드 배포 (Railway)

> 자세한 내용: [BACKEND_DEPLOY.md](./BACKEND_DEPLOY.md)

- [ ] Railway 가입 → GitHub 연결
- [ ] New Project → `backend` 폴더 선택
- [ ] PostgreSQL 플러그인 추가
- [ ] 환경변수 입력 (SECRET_KEY, API 키 전체)
- [ ] `requirements.txt`에 `psycopg2-binary` 추가 후 재배포
- [ ] 각 소셜 로그인 콘솔에 Railway 도메인 Redirect URI 등록
- [ ] 배포 완료 확인 (`/docs` 접속 테스트)

---

## 5단계 — 프론트엔드 배포 (Vercel)

- [ ] Vercel 가입 → GitHub 연결
- [ ] `frontend` 폴더 선택해서 배포
- [ ] 환경변수 입력 (`NEXT_PUBLIC_KAKAO_MAP_KEY` 등)
- [ ] 배포 URL을 백엔드 CORS에 추가
- [ ] 카카오 개발자 콘솔에 Vercel 도메인 등록

---

## 6단계 — Flutter 앱 개발 (2단계)

- [ ] Flutter 프로젝트 초기화 (`mobile/` 폴더)
- [ ] 앱 패키지명 설정 (`com.yourname.tripmatejeju`)
- [ ] 카카오 개발자 콘솔에 Android / iOS 플랫폼 등록
- [ ] API base URL을 Railway 도메인으로 설정
- [ ] 전체 화면 Flutter로 구현
- [ ] **Apple 로그인 추가** (App Store 필수 요건)
- [ ] 카카오맵 Flutter 패키지 연동

---

## 7단계 — 스토어 배포

### Google Play Store
- [ ] Google Play Console 계정 생성 ($25 일회성)
- [ ] Android 앱 서명 키스토어 생성
- [ ] `flutter build appbundle --release`
- [ ] 스토어 등록 정보 작성 (설명, 스크린샷, 아이콘)
- [ ] 개인정보처리방침 URL 준비
- [ ] 앱 제출 → 심사 대기

### Apple App Store
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] App Store Connect 앱 등록
- [ ] iOS 앱 서명 설정 (Xcode)
- [ ] `flutter build ipa`
- [ ] 스크린샷 준비 (iPhone 6.5인치 필수)
- [ ] 개인정보처리방침 URL 준비
- [ ] 앱 제출 → 심사 대기

---

## 참고 문서

| 문서 | 내용 |
|------|------|
| [PLANNING.md](./PLANNING.md) | 전체 기획서, ERD, 소셜 로그인 가이드 |
| [BACKEND_DEPLOY.md](./BACKEND_DEPLOY.md) | Railway 배포 단계별 가이드 |
| [KAKAO_MAP_AUTH.md](./KAKAO_MAP_AUTH.md) | 카카오맵 인증 환경별 설정 가이드 |
| [Figma 화면설계](https://www.figma.com/design/pbsesQKBVQDuALbe7dtI0g) | UI/UX 디자인 |
| [Figma Flow/ERD](https://www.figma.com/board/MyBsmYRbq6SMxe7LTKtbDS) | 플로우 차트 |
