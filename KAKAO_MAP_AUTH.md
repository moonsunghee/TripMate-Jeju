# 카카오맵 인증 설정 가이드

> 작성일: 2026-03-16
> 카카오 개발자 콘솔: https://developers.kakao.com

---

## 핵심 개념

카카오맵 API는 별도 인증 서버가 필요 없고, **호출 출처(도메인 or 앱 식별자)를 콘솔에 등록**하는 방식으로 인증해요.
등록된 출처에서만 API 키가 정상 작동하고, 등록되지 않은 곳에서 호출하면 오류가 발생해요.

### 사용하는 키 종류

| 키 종류 | 사용처 | 등록 위치 |
|--------|--------|----------|
| JavaScript 키 | 웹(Next.js) 지도 렌더링 | `frontend/.env.local` |
| REST API 키 | 백엔드 장소 검색 (카카오 로컬 API) | `backend/.env` |

> 두 키 모두 **같은 카카오 앱**에서 발급받으면 돼요. 별도 앱 생성 불필요.

---

## 환경별 설정

### 웹 (Next.js)

카카오 개발자 콘솔 → 내 애플리케이션 → 앱 설정 → **플랫폼 → Web** 탭에서 허용 도메인 등록:

| 환경 | 등록 도메인 |
|------|-----------|
| 로컬 개발 | `http://localhost:3000` |
| Vercel 배포 후 | `https://tm-jeju.vercel.app` |

**`.env.local` 설정:**
```env
NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JavaScript_키
```

**Next.js에서 카카오맵 스크립트 로드 예시:**
```html
<!-- app/layout.tsx 또는 _document.tsx -->
<Script
  src={`//dapi.kakao.com/maps/sdk/load?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services`}
  strategy="beforeInteractive"
/>
```

---

### 백엔드 (FastAPI — 카카오 로컬 API)

장소 검색은 서버에서 REST API 키로 호출하므로 도메인 등록이 필요 없어요.

**`backend/.env` 설정:**
```env
KAKAO_REST_API_KEY=발급받은_REST_API_키
```

**사용 엔드포인트:**
- 장소 검색: `GET /api/places/kakao/search?q=장소명&category=restaurant`

---

### Flutter 앱 (모바일)

모바일은 도메인 대신 **앱 식별자**를 등록해요. 지도 렌더링에는 `kakao_map_plugin` 패키지를 사용해요.

카카오 개발자 콘솔 → 플랫폼 탭에서 각각 추가:

#### Android
- 플랫폼 → **Android** 탭 → 패키지명 등록
- 패키지명 예시: `com.yourname.tripmatejeju`
- 위치: `android/app/build.gradle`의 `applicationId`

```
등록할 패키지명: com.yourname.tripmatejeju
키 해시: (아래 명령어로 생성)
```

키 해시 생성 명령어:
```bash
# Mac/Linux
keytool -exportcert -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android -keypass android | \
  openssl sha1 -binary | openssl base64

# Windows
keytool -exportcert -alias androiddebugkey \
  -keystore "%USERPROFILE%\.android\debug.keystore" \
  -storepass android -keypass android | \
  openssl sha1 -binary | openssl base64
```

#### iOS
- 플랫폼 → **iOS** 탭 → 번들 ID 등록
- 번들 ID 예시: `com.yourname.tripmatejeju`
- 위치: Xcode → Runner → General → Bundle Identifier

**Flutter 카카오맵 패키지 설치:**
```yaml
# pubspec.yaml
dependencies:
  kakao_map_plugin: ^2.0.0
```

**Flutter에서 앱 키 초기화:**
```dart
// main.dart
void main() {
  KakaoMapSdk.instance.initialize(appKey: 'JavaScript_키_입력');
  runApp(const MyApp());
}
```

---

## 배포 단계별 체크리스트

### 1단계 — 로컬 개발 시작 전
- [ ] 카카오 개발자 콘솔에서 앱 생성
- [ ] JavaScript 키, REST API 키 확인
- [ ] 플랫폼 → Web → `http://localhost:3000` 등록
- [ ] `frontend/.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 입력
- [ ] `backend/.env`에 `KAKAO_REST_API_KEY` 입력

### 2단계 — Vercel 배포 후
- [ ] 플랫폼 → Web → Vercel 도메인 추가
  ```
  https://tm-jeju.vercel.app
  ```
- [ ] Vercel 환경변수에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 추가

### 3단계 — Flutter 앱 개발 시
- [ ] 플랫폼 → Android → 패키지명 + 키 해시 등록
- [ ] 플랫폼 → iOS → 번들 ID 등록
- [ ] `pubspec.yaml`에 `kakao_map_plugin` 추가
- [ ] `main.dart`에 앱 키 초기화 코드 추가

---

## 자주 발생하는 오류

| 오류 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `INVALID_ORIGIN` | 도메인 미등록 | 카카오 콘솔에서 현재 도메인 추가 |
| `INVALID_APP_KEY` | 키 오타 또는 잘못된 키 종류 사용 | JavaScript 키 / REST API 키 구분 확인 |
| `KA-SDK-0001` (Flutter) | 앱 키 초기화 누락 | `main.dart`에서 `initialize()` 호출 확인 |
| 지도가 빈 화면으로 표시 | 스크립트 로드 타이밍 이슈 | `strategy="beforeInteractive"` 설정 |

---

## 카카오 개발자 콘솔 앱 설정 요약

하나의 앱에서 아래 항목을 모두 관리해요:

```
카카오 앱
├── 앱 키
│   ├── JavaScript 키  →  웹 지도 렌더링
│   ├── REST API 키    →  백엔드 장소 검색 (카카오 로컬 API)
│   └── Native 앱 키  →  Flutter 소셜 로그인
│
├── 플랫폼
│   ├── Web: localhost:3000, tm-jeju.vercel.app
│   ├── Android: 패키지명 + 키 해시
│   └── iOS: 번들 ID
│
└── 제품 설정
    ├── 카카오 로그인 → 활성화 ON
    └── Redirect URI 등록
```
