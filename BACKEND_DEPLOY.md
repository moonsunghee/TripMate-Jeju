# TripMate-Jeju 백엔드 배포 계획

> 작성일: 2026-03-16
> 목적: FastAPI 백엔드 서버를 Railway에 배포하여 Flutter 앱과 연결하기 위한 단계별 가이드

---

## 배포 플랫폼: Railway

### 선택 이유
- GitHub 저장소 연결만으로 자동 배포
- PostgreSQL 플러그인 클릭 한 번으로 추가
- 환경변수 UI에서 편하게 관리
- `DATABASE_URL` 자동 주입
- HTTPS 도메인 자동 발급

### 요금
- **Hobby 플랜**: 월 $5 (크레딧 포함) → 초기 단계에서 해결 가능
- **Pro 플랜**: 월 $20 → 실 사용자 유입 후 고려
- 예상 초기 비용: FastAPI 서버 ~$2~3 + PostgreSQL ~$1~2 = **월 $5 이하**

---

## 배포 전 코드 수정사항

### 1. PostgreSQL 드라이버 추가

`backend/requirements.txt`에 아래 항목 추가:

```
psycopg2-binary
```

### 2. SECRET_KEY 교체

`backend/app/core/config.py`의 아래 값을 배포 시 반드시 환경변수로 교체:

```python
# 현재 (개발용 — 절대 그대로 배포하면 안 됨)
SECRET_KEY: str = "dev-secret-key-change-in-production"

# 배포 시 Railway 환경변수에 아래처럼 강력한 랜덤 키 입력
# SECRET_KEY=생성한_랜덤_키_값
```

랜덤 키 생성 방법:
```bash
openssl rand -hex 32
```

### 3. CORS 설정 업데이트

`backend/main.py`의 `allow_origins`에 Railway 배포 도메인 추가:

```python
allow_origins=[
    "http://localhost:3000",
    "https://tm-jeju.vercel.app",
    "https://YOUR-RAILWAY-DOMAIN.railway.app",  # 배포 후 추가
]
```

> Flutter 모바일 앱은 웹 도메인이 없으므로 CORS 영향 없음. 웹(Vercel) 연동 시에만 필요.

---

## Railway 배포 단계

### Step 1 — Railway 가입 및 프로젝트 생성
1. [railway.app](https://railway.app) 접속 → GitHub 계정으로 가입
2. **New Project** → **Deploy from GitHub repo** 선택
3. `TripMate-Jeju` 저장소 선택
4. Root Directory를 `backend`로 지정

### Step 2 — PostgreSQL 추가
1. 프로젝트 대시보드에서 **+ New** → **Database** → **PostgreSQL** 클릭
2. Railway가 `DATABASE_URL` 환경변수를 자동으로 생성해줌

### Step 3 — 환경변수 입력
Railway 대시보드 → Variables 탭에서 아래 항목 입력:

```env
SECRET_KEY=<openssl rand -hex 32으로 생성한 값>
ACCESS_TOKEN_EXPIRE_MINUTES=60

KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FRONTEND_URL=https://tm-jeju.vercel.app
BACKEND_URL=https://YOUR-RAILWAY-DOMAIN.railway.app
```

> `DATABASE_URL`은 PostgreSQL 플러그인 추가 시 자동으로 주입되므로 별도 입력 불필요.

### Step 4 — 소셜 로그인 Redirect URI 업데이트

각 플랫폼 개발자 콘솔에서 배포 도메인을 Redirect URI에 추가:

| 플랫폼 | 추가할 URI |
|--------|-----------|
| 카카오 | `https://YOUR-RAILWAY-DOMAIN.railway.app/api/auth/kakao/callback` |
| 네이버 | `https://YOUR-RAILWAY-DOMAIN.railway.app/api/auth/naver/callback` |
| 구글 | `https://YOUR-RAILWAY-DOMAIN.railway.app/api/auth/google/callback` |

### Step 5 — Flutter 앱 API URL 교체

Flutter 코드에서 API base URL을 Railway 도메인으로 교체:

```dart
// 예시
const String baseUrl = "https://YOUR-RAILWAY-DOMAIN.railway.app";
```

---

## 배포 후 확인사항

- [ ] `https://YOUR-RAILWAY-DOMAIN.railway.app/` 접속 시 `{"message": "TripMate-Jeju API", "version": "0.1.0"}` 응답 확인
- [ ] `https://YOUR-RAILWAY-DOMAIN.railway.app/docs` 에서 Swagger UI 확인
- [ ] 소셜 로그인 (카카오/네이버/구글) 정상 작동 확인
- [ ] Flutter 앱에서 API 호출 테스트
- [ ] 채팅 WebSocket 연결 테스트

---

## 참고: 전체 배포 로드맵

| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | `requirements.txt`에 `psycopg2-binary` 추가 | ⏳ 대기 |
| 2 | Railway 가입 & GitHub 연결 & PostgreSQL 추가 | ⏳ 대기 |
| 3 | 환경변수 입력 (SECRET_KEY, OAuth 키 등) | ⏳ 대기 |
| 4 | 소셜 로그인 콘솔에 배포 URL 등록 | ⏳ 대기 |
| 5 | Flutter 앱 API URL 교체 | ⏳ 대기 |
| 6 | 배포 후 전체 기능 테스트 | ⏳ 대기 |
| 7 | App Store / Google Play 제출 | ⏳ 대기 |

---

## 관련 문서

- [PLANNING.md](./PLANNING.md) — 소셜 로그인 OAuth 키 등록 가이드 포함
- [Railway 공식 문서](https://docs.railway.app)
- [Railway 요금 페이지](https://railway.app/pricing)
