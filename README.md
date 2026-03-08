# TripMate-Jeju 🌿

> AI 기반 제주 여행 코스 생성 및 동행 모집 플랫폼

---

## 소개

TripMate-Jeju는 생성형 AI를 활용해 제주 여행 코스를 자동으로 설계하고, 함께 여행할 동행자를 모집할 수 있는 플랫폼입니다. 여행 목적, 기간, 지역을 입력하면 AI가 하루 일정(식사 · 관광지 · 숙소)을 자동으로 생성합니다.

---

## 주요 기능

- **AI 코스 자동 생성** — 여행 조건 입력 시 AI가 하루 일정을 자동 설계
- **코스 관리** — 임시저장 / 저장 / 공유 / 모집 상태로 코스 관리
- **동행 모집 게시판** — 내 코스로 동행자 모집, 모집 완료 시 채팅방 자동 생성
- **커뮤니티** — 본인 코스 및 타인 코스 공유
- **채팅** — 그룹 채팅 + 1:1 다이렉트 채팅

---

## 기술 스택

### 1단계 (웹 프로토타입)
| 구분 | 기술 |
|------|------|
| Frontend | Next.js |
| Backend | Python (FastAPI) |
| AI | 생성형 AI API |
| 배포 | Vercel (Frontend) |

### 2단계 (모바일)
| 구분 | 기술 |
|------|------|
| Frontend | Flutter (iOS / Android) |
| Backend | Python API 재사용 |
| 배포 | App Store, Google Play |

---

## 시작하기

### 요구사항
- Node.js 18+
- Python 3.10+

### 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

### 백엔드 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 아래 항목을 설정하세요.

```env
# AI API
AI_API_KEY=your_api_key_here

# Database
DATABASE_URL=your_database_url_here

# Auth (소셜 로그인)
KAKAO_CLIENT_ID=
GOOGLE_CLIENT_ID=
NAVER_CLIENT_ID=
```

---

## 배포

- **Frontend**: [Vercel](https://vercel.com) — 추후 URL 추가 예정
- **Backend**: 추후 추가 예정

---

## 프로젝트 구조

```
TripMate-Jeju/
├── frontend/                  # Next.js 웹 프론트
│   ├── app/                   # Next.js App Router
│   ├── components/            # 공통 컴포넌트
│   ├── lib/                   # API 호출, 유틸
│   ├── public/                # 정적 파일
│   └── .env.example
│
├── backend/                   # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # 라우터 (엔드포인트)
│   │   ├── models/            # DB 모델
│   │   ├── schemas/           # Pydantic 스키마
│   │   ├── services/          # 비즈니스 로직 + AI 호출
│   │   └── core/              # 설정, DB 연결
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── mobile/                    # Flutter (2단계)
├── .gitignore
├── README.md
└── PLANNING.md                # 프로젝트 기획서 (내부용)
```

---

## 관련 문서

- [기획서 (PLANNING.md)](./PLANNING.md)
- [Figma Flow/ERD](https://www.figma.com/board/MyBsmYRbq6SMxe7LTKtbDS)
- [Figma 화면설계](https://www.figma.com/design/pbsesQKBVQDuALbe7dtI0g)
