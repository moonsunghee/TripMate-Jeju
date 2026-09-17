# TripMate-Jeju 기획서

> AI 기반 제주 여행 코스 생성 및 동행 모집 플랫폼
>
> - Figma 화면설계: https://www.figma.com/design/pbsesQKBVQDuALbe7dtI0g
> - Figma Flow/ERD: https://www.figma.com/board/MyBsmYRbq6SMxe7LTKtbDS

---

## 프로젝트 개요

TripMate-Jeju는 AI가 여행 조건(목적·지역·기간·식사·관광 횟수)을 분석해 최적의 제주 여행 코스를 자동 생성해주는 서비스입니다.
생성된 코스를 커뮤니티에 공유하거나 동행자를 모집하고, 채팅으로 소통할 수 있습니다.

- **라이브 URL**: https://tm-jeju.vercel.app
- **타겟**: 제주 여행을 계획하는 개인 / 동행을 구하는 여행자

---

## 개발 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| 1단계 | Next.js + FastAPI 웹 서비스 | 🔨 진행 중 |
| 2단계 | 모바일 앱 (iOS / Android) | 🤝 협의 후 결정 |
| 출시 | App Store / Google Play | ⏳ 예정 |

> **2단계 모바일 프레임워크**: Flutter 또는 React Native — 팀 협의 후 확정 예정

---

## 기술 스택

### 현재 (1단계)

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 + TypeScript + SCSS + shadcn/ui |
| 백엔드 | FastAPI (Python) + SQLite |
| AI 코스 생성 | OpenAI GPT-4o-mini (키 미설정 시 샘플 데이터 반환) |
| 인증 | JWT + Kakao / Naver / Google OAuth 2.0 |
| 실시간 채팅 | WebSocket |
| 배포 | Vercel (프론트) + Railway (백엔드) |
| 패키지 매니저 | **npm** (bun, yarn 사용 금지) |

### 예정 (2단계) — 협의 중

| 영역 | 옵션 A | 옵션 B |
|------|--------|--------|
| 프론트엔드 | Flutter | React Native |
| AI | LangChain / LangGraph 에이전트 고도화 | (동일) |
| 백엔드 | 현재 Python API 재사용 | (동일) |

> 선택 기준: 팀 기술 스택, 유지보수 용이성, 커뮤니티 등 협의 후 결정

---

## 시스템 아키텍처

```
Browser (모바일 430px 기준)
  └── Next.js 15 (Vercel)
        ├── app/             — App Router (route = 폴더)
        ├── components/      — 공통 UI 컴포넌트
        ├── lib/api.ts ─────► FastAPI (Railway / localhost:8000)
        ├── lib/auth.ts            ├── routers/   — domain별 분리
        └── lib/types.ts           ├── models.py  — SQLAlchemy ORM
                                   ├── schemas.py — Pydantic
                                   └── tripmate.db — SQLite
```

- 프론트-백엔드: REST API + JWT Bearer 토큰
- AI 코스 생성: 백엔드에서 OpenAI API 호출 → `OPENAI_API_KEY` 없으면 샘플 반환
- 실시간 채팅: WebSocket (`/ws/chat/{room_id}`)
- 소셜 로그인: OAuth 키 미설정 시 501 응답 (게스트 로그인으로 우회 가능)

---

## 핵심 기능

### 1. AI 코스 자동 생성
사용자 조건 입력 → AI가 하루 일정 자동 생성

```
목적 선택 → 기간 선택 → 식사/관광 횟수 선택 → 지역 선택
  → AI 코스 생성 (로딩) → 코스 3개 중 선택 → 상세 확인 → 저장/공유/모집 설정
```

### 2. 코스 상태 관리

```
임시저장 (설계 중)
  └→ 마스터 (저장됨, 비공개)
       ├→ 공유중  (공유O, 모집X) → 게시판 노출
       ├→ 모집중  (모집O)        → 게시판 노출
       └→ 모집완료               → 채팅방 자동 생성
```

### 3. 동행 모집 게시판
코스 기반 동행 모집 → 모집 완료 시 그룹 채팅방 자동 생성

### 4. 커뮤니티
공유 코스 탐색 / 타인 코스 합류

### 5. 채팅
그룹 채팅(동행방) + 1:1 다이렉트 채팅

---

## 화면 구성

### 하단 내비게이션 (5탭)

| 탭 | 화면 내용 |
|----|-----------|
| 홈 | 사용자 정보, 내 공유/모집 코스 요약 |
| 게시판 | 동행 모집 + 공유 코스 목록 (p{id} / c{id} prefix) |
| 코스설계 | AI 코스 생성 플로우 진입 |
| 내 코스 | 본인 코스 목록 + 상태 배지 |
| 채팅 | 채팅방 목록 (g{id} 그룹 / d{id} 1:1) |

### 코스 설계 플로우 (8단계)

| 단계 | 화면 |
|------|------|
| 1 | 여행 목적 선택 (카드 그리드) |
| 2 | 기간 선택 |
| 3 | 식사·관광지 횟수 선택 |
| 4 | 지역 선택 (제주 지도 + 버튼) |
| 5 | AI 코스 생성 중 (로딩) |
| 6 | 생성된 코스 3개 선택 |
| 7 | 코스 상세 확인 (지도, 일정, 해시태그) |
| 8 | 저장 / 공유 / 모집 설정 |

---

## 프로젝트 구조

```
TripMate-Jeju/
├── frontend/                  — Next.js 앱 (Vercel 배포)
│   ├── app/
│   │   ├── (auth)/            — 로그인 관련
│   │   └── (main)/            — 인증 후 메인
│   │       ├── home/
│   │       ├── board/
│   │       ├── course-design/
│   │       ├── my-courses/
│   │       └── chat/
│   ├── components/
│   │   ├── ui/                — shadcn/ui (직접 수정 금지)
│   │   └── *.tsx              — 프로젝트 공통 컴포넌트
│   ├── lib/
│   │   ├── api.ts             — 모든 API 호출의 단일 진입점
│   │   ├── auth.ts            — JWT + 유저 정보 관리
│   │   └── types.ts           — 공유 TypeScript 타입
│   └── styles/
│       ├── _variables.scss    — 색상, 폰트, spacing 변수
│       └── _mixins.scss       — 반응형, flexbox, card 믹스인
│
└── backend/                   — FastAPI (Railway 배포)
    ├── main.py                — 앱 진입점, CORS, 라우터 등록
    ├── models.py              — SQLAlchemy ORM 모델
    ├── schemas.py             — Pydantic 요청/응답 스키마
    ├── database.py            — DB 연결 설정
    └── routers/
        ├── auth.py            — 인증 (JWT, OAuth)
        ├── courses.py         — 코스 CRUD + AI 생성
        ├── companion.py       — 동행 모집 게시판
        ├── chat.py            — 채팅 (WebSocket)
        ├── places.py          — 장소 검색 (Kakao Local API)
        └── comments.py        — 댓글
```

---

## 개발 환경 설정

### 사전 준비
- Node.js 20+
- Python 3.11+

### 프론트엔드 실행

```bash
cd frontend
npm install
cp .env.local.example .env.local   # 환경변수 설정
npm run dev                         # http://localhost:3000
```

### 백엔드 실행

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # API 키 설정
uvicorn main:app --reload           # http://localhost:8000
```

### 환경변수

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_KAKAO_MAP_KEY=카카오_JavaScript_키
```

**backend/.env**
```
OPENAI_API_KEY=sk-...         # AI 코스 생성 (없으면 샘플 데이터)
SECRET_KEY=임의_비밀키

# 소셜 로그인 (선택 — 없으면 501 응답)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

> API 키 없이도 **게스트 로그인**으로 핵심 기능 테스트 가능

---

## 데이터 모델 (ERD 요약)

| 엔티티 | 설명 |
|--------|------|
| User | 사용자 계정 |
| Course | 여행 코스 (기간, 지역, 상태) |
| Place | 장소 (Kakao Local API 데이터) |
| CoursePlace | Course ↔ Place 연결 (방문 순서, 날짜) |
| CompanionPost | 동행 모집 게시글 |
| CompanionJoin | 동행 참여 신청 |
| ChatRoom | 그룹 채팅방 |
| ChatMessage | 그룹 채팅 메시지 |
| DirectChatRoom | 1:1 채팅방 |
| DirectChatMessage | 1:1 채팅 메시지 |
| Comment | 댓글 |

---

## 코딩 컨벤션

| 항목 | 규칙 |
|------|------|
| 파일/폴더명 | 페이지 `kebab-case`, 컴포넌트 `PascalCase`, Python `snake_case` |
| 변수/함수 | TypeScript `camelCase`, Python `snake_case` |
| 상수 | `UPPER_SNAKE_CASE` |
| 스타일 | SCSS modules만 사용 — inline style, Tailwind 직접 사용 금지 |
| API 호출 | `lib/api.ts` 경유 필수 — 컴포넌트에서 `fetch()` 직접 호출 금지 |
| 인증 | `lib/auth.ts` 경유 필수 — localStorage 직접 접근 금지 |

---

## 선택 데이터

**여행 목적**
휴식, 등산, 해양레포츠, 트레일/러닝, 제주올레, 웰니스, 골프, 낚시, 자전거일주, 가족(어린이), 가족(부모님)

**여행 지역**
제주시, 애월읍, 한림읍, 한경면, 대정읍, 안덕면, 서귀포시, 남원읍, 표선읍, 성산읍, 구좌읍, 조천읍, 우도, 마라도, 가파도, 추자도

---

## 1단계 작업 분담 (협의용)

> 담당자 란은 팀 협의 후 채워주세요. 작업 규모에 따라 조정 가능합니다.

### 공통 / 기반 작업

| # | 작업 항목 | 내용 | 담당 |
|---|-----------|------|------|
| C-1 | 프로젝트 셋업 | 레포 생성, 폴더 구조, 개발 환경 통일 | |
| C-2 | DB 설계 확정 | ERD 리뷰 및 최종 확정 | |
| C-3 | 배포 환경 구성 | Vercel (프론트) + Railway (백엔드) 연결 | |
| C-4 | API 문서화 | Swagger 또는 Notion으로 엔드포인트 정리 | |

### 백엔드 (FastAPI)

| # | 작업 항목 | 엔드포인트 | 담당 |
|---|-----------|------------|------|
| B-1 | 인증 | 회원가입, 로그인, JWT 발급, OAuth (카카오/네이버/구글) | |
| B-2 | 코스 CRUD | 생성, 조회, 수정, 삭제, 상태 변경 | |
| B-3 | AI 코스 생성 | OpenAI 연동, 프롬프트 설계, 샘플 fallback | |
| B-4 | 동행 게시판 | 게시글 CRUD, 참여 신청/수락/거절 | |
| B-5 | 채팅 | WebSocket 그룹 채팅 + 1:1 다이렉트 채팅 | |
| B-6 | 장소 검색 | Kakao Local API 연동 | |
| B-7 | 댓글 | 게시글별 댓글 CRUD | |

### 프론트엔드 (Next.js)

| # | 작업 항목 | 화면 | 담당 |
|---|-----------|------|------|
| F-1 | 로그인 / 회원가입 | 이메일 로그인 + 소셜 로그인 버튼 | |
| F-2 | 홈 | 사용자 정보, 내 공유/모집 코스 요약 | |
| F-3 | 코스 게시판 | 목록 (동행 모집 + 공유 코스), 필터 | |
| F-4 | 게시글 상세 | 지도, 일정, 참가자, 댓글 | |
| F-5 | 코스 설계 플로우 | 목적 → 기간 → 횟수 → 지역 → AI 생성 → 선택 → 상세 → 저장 | |
| F-6 | 내 코스 | 코스 목록 + 상태 배지 + 상세/편집 | |
| F-7 | 채팅 | 채팅방 목록, 그룹 채팅, 1:1 채팅 | |
| F-8 | 공통 컴포넌트 | BottomNav, CourseCard, 지도 (Kakao Map) | |

### 작업 우선순위 (권장)

```
1순위 (MVP 핵심)
  C-1 셋업 → B-1 인증 → F-1 로그인
  → B-2 코스 CRUD + B-3 AI 생성 → F-5 코스 설계 플로우

2순위 (커뮤니티)
  B-4 동행 게시판 → F-3 게시판 + F-4 상세
  → F-2 홈 + F-6 내 코스

3순위 (소통)
  B-5 채팅 → F-7 채팅
  B-7 댓글 → (게시글 상세에 통합)

4순위 (완성도)
  C-4 API 문서화, 배포 안정화, 성능 최적화
```
