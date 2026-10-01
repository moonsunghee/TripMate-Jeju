# 디자인 도구 사용 가이드

TripMate-Jeju 화면을 AI로 만들거나 다듬을 때 쓰는 스킬·MCP 정리입니다.
팀원 누구나 Claude Code에서 이 레포를 열면 바로 쓸 수 있습니다.

> 핵심: 도구는 "기준"과 "눈"을 줄 뿐이고, 결과는 **요청서를 얼마나 구체적으로 쓰느냐**가 결정합니다. 맨 아래 요청서 템플릿부터 채워 보세요.

---

## 1. 설치된 도구 한눈에 보기

| 도구 | 종류 | 역할 | 언제 쓰나 |
|---|---|---|---|
| **frontend-design** | 스킬 (Anthropic 공식) | 새 화면의 디자인 방향 잡기 | 새 페이지·컴포넌트를 만들 때 |
| **impeccable** | 스킬 | AI 티 나는 디자인 점검·교정, 명령어 20여 개 | 만든 화면을 점검하고 다듬을 때 |
| **emil-design-eng** | 스킬 | 애니메이션·인터랙션·마감 디테일 | 전환 효과, 버튼 반응, 바텀시트 등 |
| **webapp-testing** | 스킬 (Anthropic 공식) | 로컬 서버를 띄워 Playwright 스크립트로 테스트 | 기능 동작을 자동 확인할 때 |
| **Playwright** | MCP (`.mcp.json`) | Claude가 브라우저를 직접 열어 보고 클릭 (iPhone 15 화면) | 결과 화면을 눈으로 확인시킬 때 |
| **Context7** | MCP (`.mcp.json`) | Next.js·React 등 최신 공식 문서 조회 | 라이브러리 코드를 짤 때 (자동) |
| **Figma** | MCP (개인 설정) | 피그마 파일의 색·간격 읽기 | 피그마 시안을 코드로 옮길 때 |

역할 분담: **frontend-design = 방향**, **impeccable = 점검**, **emil = 움직임**. 셋 다 "좋은 디자인"의 규칙을 갖고 있으니 한 번에 하나씩 부르는 게 결과가 깔끔합니다.

---

## 2. 처음 한 번만 할 일

1. 이 폴더에서 Claude Code 실행 → `.mcp.json`의 MCP 2개(context7, playwright) 사용 여부를 물으면 **승인**
2. `/mcp` 입력 → context7, playwright가 `connected`인지 확인
3. Impeccable 초기화 (프로젝트 기준 문서 생성)
   ```
   /impeccable init
   ```
   몇 가지 질문(대상 사용자, 브랜드, 톤)에 답하면 `PRODUCT.md`(제품 전략)와 `DESIGN.md`(디자인 시스템)가 만들어집니다. 이후 모든 디자인 작업이 이 두 문서를 기준으로 삼습니다.
   - 이미 만들어진 화면에서 디자인 시스템만 뽑으려면: `/impeccable document`
4. (webapp-testing을 쓸 경우만) 맥 터미널에서
   ```bash
   pip install playwright && playwright install chromium
   ```

> Impeccable은 처음 실행할 때 작은 실행 파일을 `~/.impeccable/bin/`에 한 번 내려받습니다. 정상입니다.

---

## 3. 도구별 사용법

### frontend-design — 새 화면 만들기
자동으로 불립니다. 새 화면을 요청할 때 요청서(5장)를 함께 붙이세요.
```
동행 모집 게시판 목록 화면을 새로 만들어줘. 아래 요청서 기준으로.
(요청서 붙여넣기)
```

### impeccable — 점검하고 다듬기
`/impeccable <명령> <대상>` 형식입니다. 대상은 파일 경로나 라우트.

| 명령 | 하는 일 | TripMate 예시 |
|---|---|---|
| `shape` | 코드 전에 UX·UI를 인터뷰로 설계 | `/impeccable shape 코스 공유 화면` |
| `critique` | UX 관점 평가 (위계, 인지 부하 등) | `/impeccable critique frontend/app/design` |
| `audit` | 접근성·성능·반응형·안티패턴 점수 리포트 | `/impeccable audit frontend/app/board` |
| `polish` | 출시 전 정렬·간격·일관성 마감 | `/impeccable polish frontend/app/my-courses` |
| `layout` | 간격·리듬·시각적 위계 개선 | `/impeccable layout 홈 화면` |
| `typeset` | 글꼴 위계·크기·가독성 개선 | `/impeccable typeset 코스 상세` |
| `clarify` | 버튼 문구, 오류 메시지 등 UX 문구 개선 | `/impeccable clarify 로그인·회원가입` |
| `harden` | 긴 텍스트, 빈 데이터, 오류 상태 대비 | `/impeccable harden 장소카드` |
| `onboard` | 첫 실행, 빈 화면(empty state) 설계 | `/impeccable onboard 내 코스 (코스 없음 상태)` |
| `adapt` | 화면 크기·터치 영역 대응 | `/impeccable adapt 바텀 내비게이션` |
| `bolder` / `quieter` | 밋밋하면 강하게 / 과하면 차분하게 | `/impeccable quieter 여행 목적 선택` |
| `distill` | 불필요한 요소 덜어내기 | `/impeccable distill 코스 설계 3단계` |
| `document` | 현재 화면에서 DESIGN.md 추출 | `/impeccable document` |

추천 순서: **critique → audit → (layout/typeset/clarify 중 필요한 것) → polish**

### emil-design-eng — 움직임과 손맛
전환 효과, 버튼 눌림, 바텀시트, 토스트처럼 "느낌"을 다룰 때 이름을 불러주세요.
```
emil-design-eng 스킬 기준으로 코스 설계 위자드의 단계 전환 애니메이션을 리뷰하고 고쳐줘.
```
기본 원칙: 모든 걸 움직이지 않는다 / scale(0)에서 시작하지 않는다 / 사용자가 자주 누르는 요소는 짧고 빠르게 / 중간에 끊을 수 있는 전환(CSS transition)을 쓴다.

### Playwright MCP — Claude에게 눈 달아주기
```
로컬(localhost:3000)에서 코스 설계 1~8단계를 끝까지 눌러보고, 단계마다 스크린샷을 찍어서 깨진 곳을 알려줘.
```
```
tm-jeju.vercel.app 홈 화면을 열고 방금 수정한 부분이 의도대로 보이는지 확인해줘.
```
기본 화면은 iPhone 15 크기입니다.

### webapp-testing — 반복 가능한 자동 테스트
```
webapp-testing 스킬로 프론트(3000)와 백엔드(8000)를 같이 띄우고, 이메일 회원가입 → 로그인 → 코스 생성 흐름을 테스트하는 스크립트를 만들어줘.
```

### Context7 — 최신 문서
대부분 자동이지만, 확실히 하려면 문장 끝에 `use context7`을 붙이세요.
```
Next.js 15 App Router에서 서버 액션으로 폼 제출하는 코드 짜줘. use context7
```

---

## 4. 추천 작업 흐름

```
① 요청서 작성 (5장)            ← 가장 중요
② 새 화면: frontend-design 로 생성 / 복잡한 화면: /impeccable shape 로 먼저 설계
③ Playwright 로 직접 보게 하기  "모바일 화면으로 열어서 확인해줘"
④ /impeccable critique → audit  문제 목록 받기
⑤ 필요한 명령으로 수정           layout · typeset · clarify · harden
⑥ 움직임 다듬기                 emil-design-eng
⑦ /impeccable polish           마감 → check 스킬로 빌드 확인 → 커밋
```
첫 결과물은 보통 1~2번 다듬어야 합니다. 한 번에 완벽하길 기대하지 마세요.

---

## 5. 디자인 요청서 템플릿

아래를 복사해서 채운 뒤 요청과 함께 붙여넣으세요. "고급스럽게", "전문가처럼" 같은 말 대신 **구체적인 대상·레퍼런스·제약**을 적는 게 핵심입니다.

```markdown
## 화면
- 이름: (예: 동행 모집 게시판 목록)
- 경로/파일: (예: frontend/app/board/page.tsx)
- 이 화면의 한 가지 목적: (예: 내 일정에 맞는 동행 모집글을 빨리 찾기)

## 사용자
- 누가: (예: 제주 혼행 2030, 모바일로 여행 중 확인)
- 어떤 상황에서: (예: 숙소에서 다음 날 일정 짤 때, 한 손 조작)

## 톤
- 느낌 3단어: (예: 여유로운 / 믿을 수 있는 / 가벼운)
- 피하고 싶은 느낌: (예: 광고 앱 같은 화려함, 보라색 그라데이션)

## 레퍼런스
- 참고 사이트/앱 1: (URL + 무엇을 참고할지, 예: 에어비앤비 — 카드 사진 비율)
- 참고 사이트/앱 2:

## 콘텐츠 구조 (위에서 아래로)
1.
2.
3.

## 고정 조건 (바꾸면 안 됨)
- 브랜드 색: 메인 #2D6A4F / 보조 #52B788 / 연한 #95D5B2
- 코스 상태 배지: 마스터 #2D6A4F · 모집중 #1971C2 · 참여중 #7950F2 · 모집완료 #868E96 · 임시저장 #F59F00
- 글꼴: Pretendard (시스템 폰트 폴백)
- 컴포넌트: shadcn/ui + SCSS 변수(frontend/styles/_variables.scss) 사용
- 모바일 웹 우선, 하단 BottomNav 유지, 안전 영역(safe area) 고려

## 완료 기준
- (예: iPhone 15 화면에서 첫 화면에 모집글 3개 이상 보임)
- (예: 모집글 0개일 때 빈 화면 안내가 있음)
```

---

## 6. 주의사항

- **스킬을 한 번에 여러 개 부르지 않기.** 규칙이 서로 충돌할 수 있습니다.
- **DESIGN.md가 기준입니다.** `/impeccable init` 또는 `document`로 만든 뒤, 브랜드가 바뀌면 이 파일을 먼저 고치세요.
- **Impeccable 자동 훅은 설치하지 않았습니다.** 공식 설치 프로그램(`npx impeccable install`)이 오류로 실패해서 스킬만 복사했고, 기존 `.claude/settings.json` 훅은 그대로입니다. 편집할 때마다 자동 점검을 원하면 나중에 `npx impeccable install --providers=claude --scope=project`를 다시 시도하세요.
- **이미지는 여전히 약점입니다.** AI가 만든 사진은 티가 나니 실제 관광 사진(TourAPI `firstimage`)을 쓰세요.
- **Figma MCP는 유료화 예정** 소식이 있습니다. 공식 Figma와 TalkToFigmaDesktop이 둘 다 설정돼 있으니 하나만 남기는 게 좋습니다.

## 출처
- impeccable: https://github.com/pbakaus/impeccable (Apache-2.0)
- emil-design-eng: https://github.com/emilkowalski/skills
- frontend-design, webapp-testing: https://github.com/anthropics/skills
- 참고 가이드: https://lazyowen.com/guides/claude-designer-kill
