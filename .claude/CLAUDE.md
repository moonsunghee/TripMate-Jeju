# TripMate-Jeju 프로젝트 규칙

## 기술 스택
- Frontend: Next.js 15 + TypeScript + SCSS + shadcn/ui
- Backend: FastAPI + SQLite (port 8000), venv at `backend/.venv`
- Deploy: Vercel (프론트) + Railway (백엔드) — https://tm-jeju.vercel.app
- Package manager: **npm** (bun, yarn 사용 금지)

---

## architecture.rules
> How the system fits together

```
Browser (mobile 430px)
  └── Next.js 15 (Vercel)
        ├── app/ (App Router, page.tsx per route)
        ├── components/ (공통 UI)
        ├── lib/api.ts ──────────────► FastAPI (Railway / localhost:8000)
        ├── lib/auth.ts (JWT 관리)         ├── routers/ (domain별 분리)
        └── lib/types.ts (공유 타입)        ├── models.py (SQLAlchemy ORM)
                                           ├── schemas.py (Pydantic)
                                           └── tripmate.db (SQLite)
```

- 프론트-백엔드 통신은 REST API (JWT Bearer 토큰)
- AI 코스 생성: 백엔드에서 GPT-4o-mini 호출 → `OPENAI_API_KEY` 없으면 샘플 반환
- 소셜 로그인: Kakao/Naver/Google OAuth 2.0, 키 미설정 시 501 응답
- 실시간 채팅: WebSocket (`/ws/chat/{room_id}`)

---

## naming.conventions
> File names, function names, casing

**파일/폴더**
- 페이지: `app/(route)/page.tsx` — kebab-case 라우트
- 컴포넌트: `components/FeatureName.tsx` — PascalCase
- 스타일: `app/(route)/page.module.scss` — 페이지와 동일 위치
- 훅: `hooks/useFeatureName.ts` — camelCase, `use` 접두사 필수
- 백엔드 라우터: `routers/feature_name.py` — snake_case

**코드**
- React 컴포넌트: PascalCase (`CourseCard`, `BottomNav`)
- 함수/변수: camelCase (`fetchCourses`, `isLoading`)
- 상수: UPPER_SNAKE_CASE (`MAX_COURSE_PLACES`)
- TypeScript 타입/인터페이스: PascalCase (`Course`, `CompanionPost`)
- Python 함수/변수: snake_case (`get_course_by_id`)
- Python 클래스: PascalCase (`CourseCreate`, `UserResponse`)

**API 엔드포인트**
- 경로: `/api/{resource}` — 복수형, kebab-case (`/api/companion-posts`)
- URL prefix: 게시판 `p`=동행, `c`=코스 / 채팅 `g`=그룹, `d`=다이렉트

---

## test.expectations
> When to write tests, what counts

**현재 테스트 전략** (프로토타입 단계)
- 자동화 테스트 미구축 — 수동 검증 중심
- 단, 아래 케이스는 수정 전 반드시 수동 확인:
  - `lib/api.ts` 수정 시: 인증 헤더 전달 여부
  - `lib/auth.ts` 수정 시: 토큰 저장/삭제/갱신 흐름
  - 백엔드 라우터 수정 시: `/api/auth/login` + `/api/courses/generate` 동작

**검증 체크리스트** (배포 전)
- [ ] 로그인 → 코스 생성 → 저장 → 게시판 등록 플로우
- [ ] 게스트 로그인으로 핵심 기능 접근 가능 여부
- [ ] 모바일 430px에서 레이아웃 깨짐 없음
- [ ] CORS 오류 없음 (프론트↔백엔드)

**테스트 추가 기준** (2단계 Flutter 이후)
- 비즈니스 로직 함수: 단위 테스트 필수
- API 엔드포인트: pytest로 통합 테스트
- UI: 골든 패스 E2E 테스트 (코스 생성 플로우)

---

## repo.map
> Where things live, why

```
TripMate-Jeju/
├── frontend/                  # Next.js 앱 (Vercel 배포)
│   ├── app/                   # App Router — 라우트 = 폴더
│   │   ├── (auth)/            # 로그인 관련 페이지
│   │   ├── (main)/            # 인증 후 메인 영역
│   │   │   ├── home/          # 홈
│   │   │   ├── board/         # 게시판 (동행+코스 통합)
│   │   │   ├── course-design/ # AI 코스 설계
│   │   │   ├── my-courses/    # 내 코스
│   │   │   └── chat/          # 채팅
│   │   ├── globals.scss       # Tailwind + shadcn CSS vars + SCSS imports
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui — 직접 수정 금지
│   │   └── *.tsx              # 프로젝트 공통 컴포넌트
│   ├── lib/
│   │   ├── api.ts             # 모든 API 호출의 단일 진입점
│   │   ├── auth.ts            # JWT + 유저 정보 관리
│   │   └── types.ts           # 공유 TypeScript 타입
│   ├── styles/
│   │   ├── _variables.scss    # 색상, 폰트, spacing 등 모든 변수
│   │   └── _mixins.scss       # 반응형, flexbox, card 등 믹스인
│   └── .env.local             # NEXT_PUBLIC_API_URL (커밋 금지)
│
├── backend/                   # FastAPI (Railway 배포)
│   ├── main.py                # FastAPI 앱 진입점, CORS, 라우터 등록
│   ├── models.py              # SQLAlchemy ORM 모델
│   ├── schemas.py             # Pydantic 요청/응답 스키마
│   ├── database.py            # DB 연결 설정
│   ├── routers/               # 도메인별 API 라우터
│   │   ├── auth.py            # 인증 (로그인, 소셜 OAuth)
│   │   ├── courses.py         # 코스 CRUD + AI 생성
│   │   ├── companion.py       # 동행 모집 게시판
│   │   ├── chat.py            # 채팅 (WebSocket)
│   │   ├── places.py          # 장소 검색 (Kakao Local API)
│   │   └── comments.py        # 댓글
│   ├── .env                   # API 키 (커밋 금지)
│   ├── tripmate.db            # SQLite DB (커밋 금지)
│   └── .venv/                 # Python 가상환경 (커밋 금지)
│
├── .claude/                   # Claude Code 설정
│   ├── CLAUDE.md              # 이 파일
│   ├── settings.json          # Hooks 등록
│   ├── hooks/                 # PreToolUse, PostToolUse, SessionStart
│   ├── skills/                # /dev, /check, /deploy
│   └── agents/                # code-reviewer, api-tester, ux-checker
│
├── design/                    # 디자인 에셋
├── reference/                 # 화면설계 Figma 참고파일
└── PLANNING.md                # 프로젝트 기획서
```

---

## 스타일링 규칙
- 모든 스타일은 SCSS modules (`app/(route)/page.module.scss`) 사용
- inline style, Tailwind 직접 사용 금지 (shadcn/ui 컴포넌트 내부 제외)
- 변수 import: `@import "variables"` (includePaths에 `styles/` 포함됨)
- 핵심 변수: `$color-primary: #2D6A4F` / `$mobile-max-width: 430px` / `$bottom-nav-height: 64px`

## API 규칙
- API 호출은 반드시 `lib/api.ts` 경유 — 컴포넌트에서 `fetch()` 직접 호출 금지
- 인증 토큰 관리는 `lib/auth.ts` 경유 — localStorage 직접 접근 금지
- 타입 정의는 `lib/types.ts` — 중복 정의 금지

## 제약 사항
- 새 패키지 설치 (`npm install`) 전 반드시 유저에게 확인
- `components/ui/` 는 shadcn 관리 — 명시적 요청 없이 수정 금지
- Python 명령 실행 전 반드시 venv 활성화: `source backend/.venv/bin/activate`
- AI 코스 생성은 `backend/.env`의 `OPENAI_API_KEY` 필요
