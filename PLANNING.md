# TripMate-Jeju 프로젝트 기획서

> 이 파일은 프로젝트의 기획 내용과 수정 이력을 추적하는 메모리 문서입니다.
> 매 작업 세션마다 이 파일을 참조하고 업데이트해 주세요.
> Figma: https://www.figma.com/board/MyBsmYRbq6SMxe7LTKtbDS

---

## 프로젝트 개요

- **프로젝트명**: TripMate-Jeju
- **목적**: AI 기반 제주 여행 코스 생성 및 동행 모집 플랫폼
- **저장소**: https://github.com/moonsunghee/TripMate-Jeju
- **배포 목표**: App Store, Google Play

---

## 기술 스택

### 1단계 (웹 프로토타입)
- **프론트엔드**: Next.js
- **백엔드**: Python (FastAPI)
- **AI**: 생성형 AI API (코스 자동 생성)
- **배포**: 미정

### 2단계 (모바일 리빌드)
- **프론트엔드**: Flutter (iOS / Android)
- **백엔드**: Python API 재사용
- **배포**: App Store, Google Play

---

## 핵심 기능

### 1. AI 코스 자동 생성
사용자가 여행 조건을 입력하면 AI가 하루 일정을 자동으로 만들어주는 핵심 기능.

### 2. 코스 관리
본인이 만든 코스를 임시저장/저장/공유/모집 상태로 관리.

### 3. 동행 모집 게시판
만든 코스를 기반으로 동행자를 모집하고, 모집 완료 시 채팅방 자동 생성.

### 4. 커뮤니티
본인 코스 커뮤니티 / 타인 코스 커뮤니티로 나뉘어 코스를 공유.

### 5. 채팅
그룹 채팅(동행 모집 채팅방) + 1:1 다이렉트 채팅.

---

## 코스 개발 Flow

```
코스개발
  └→ 목적선택
       └→ 기간선택  ─┐
       └→ 지역선택  ─┤
                     ↓
              코스 세부 일정 선택
              ├ 하루 식사 횟수
              ├ 하루 관광지 횟수
              └ 이동방법
                     ↓
              하루 일정 생성 (AI)
              ├ 1. 조식
              ├ 2. 디저트
              ├ 3. 관광지
              ├ 4. 중식
              ├ 5. 디저트
              ├ 6. 관광지
              ├ 7. 관광지
              ├ 8. 석식
              ├ 9. 디저트
              ├ 10. 관광지
              ├ 11. 야식
              └ 12. 숙소
                     ↓
              하루 일정 확정
```

---

## 코스 입력 항목

유저가 마스터 코스를 설계할 때 입력하는 항목:

1. 일정
2. 목적
3. 지역
4. 식사
5. 숙소
6. 관광지
7. 코스 설명
8. 공유 여부
9. 모집 여부
10. 저장 / 임시저장 / 취소

---

## User Flow (코스 상태 관리)

```
유저(본인)
  └→ 임시저장(설계중인)
       ├→ 마스터(공유X, 모집X)
       │     ├→ 공유중인 (공유O, 모집X)  →  게시판
       │     ├→ 모집중인 (공유X, 모집O)  →  게시판
       │     └→ 모집완료 된 (공유-, 모집-)
       └→ 폐기된 (일정기간 뒤 삭제)

타인이 만든 코스 (공유O 또는 모집O)
  ├→ 공유 받은  →  타인 코스 커뮤니티
  └→ 합류 된    →  타인 코스 커뮤니티
                      ↕ (합류취소 → 게시판)
```

---

## 여행 목적 선택지

| 카테고리 |
|----------|
| 휴식 |
| 등산 |
| 해양레포츠 |
| 트레일 / 러닝 |
| 제주올레 |
| 웰니스 |
| 골프 |
| 낚시 |
| 자전거일주 |
| 가족 (어린이) |
| 가족 (부모님) |

---

## 여행 지역 선택지

| 지역 |
|------|
| 제주시 |
| 애월읍 |
| 한림읍 |
| 한경면 |
| 대정읍 |
| 안덕면 |
| 서귀포시 |
| 남원읍 |
| 표선읍 |
| 성산읍 |
| 구좌읍 |
| 조천읍 |
| 우도 |
| 마라도 |
| 가파도 |
| 추자도 |

---

## 유저 수집 항목

| 항목 | 비고 |
|------|------|
| 실명인증 | |
| 닉네임 | |
| 프로필 이미지 | |
| 생년월일 | |
| 자기소개 | |
| 가입일 | 자동 |
| 수정일 | 자동 |

---

## ERD (데이터베이스 설계)

### User
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| email | VARCHAR |
| password | VARCHAR |
| nickname | VARCHAR |
| profile_image | VARCHAR |
| birthday | DATE |
| bio | TEXT |
| create_at | DATETIME |
| update_at | DATETIME |

### Course
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| user_id (FK) | LONG |
| title | VARCHAR |
| description | TEXT |
| travel_image | VARCHAR |
| duration_days | INT |
| travel_style | VARCHAR |
| region | VARCHAR |
| created_at | DATETIME |
| updated_at | DATETIME |

### Place
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| place_name | VARCHAR |
| category | VARCHAR |
| address | VARCHAR |
| phone_number | INT |
| place_image | VARCHAR |
| latitude | DECIMAL |
| longitude | DECIMAL |

### CoursePlace (Course ↔ Place 연결)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| course_id (FK) | LONG |
| place_id (FK) | LONG |
| visit_order | INT |
| day | INT |

### CompanionPost (동행 모집 게시글)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| course_id (FK) | LONG |
| user_id (FK) | LONG |
| title | VARCHAR |
| content | TEXT |
| max_people | TEXT |
| status | VARCHAR |
| start_date | DATE |
| end_date | DATE |
| created_at | DATETIME |
| updated_at | DATETIME |

### CompanionJoin (동행 참여)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| post_id (FK) | LONG |
| user_id (FK) | LONG |
| status | VARCHAR |
| created_at | DATETIME |

### ChatRoom (그룹 채팅방)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| post_id (FK) | LONG |
| created_at | DATETIME |

### ChatMessage (그룹 채팅 메시지)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| room_id (FK) | LONG |
| user_id (FK) | LONG |
| message | TEXT |
| created_at | DATETIME |

### Comment (댓글)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| user_id (FK) | LONG |
| post_id (FK) | LONG |
| content | TEXT |
| created_at | DATETIME |
| updated_at | DATETIME |

### DirectChatRoom (1:1 채팅방)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| user1_id (FK) | LONG |
| user2_id (FK) | LONG |
| created_at | DATETIME |

### DirectChatMessage (1:1 채팅 메시지)
| 컬럼 | 타입 |
|------|------|
| id (PK) | LONG |
| room_id (FK) | LONG |
| sender_id (FK) | LONG |
| message | TEXT |
| is_read | BOOLEAN |
| created_at | DATETIME |

---

## API 설계

> 개발 진행에 따라 추가 예정

---

## 개발 일정

| 단계 | 내용 | 상태 |
|------|------|------|
| 기획 | Figma 기반 기획서 작성 | ✅ 완료 |
| 1단계 | Next.js + FastAPI 개발 | ⏳ 대기 |
| 2단계 | Flutter 리빌드 | ⏳ 대기 |
| 배포 | App Store / Google Play | ⏳ 대기 |

---

## 수정 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-08 | Figma 기반 초기 기획서 작성 (코스개발 Flow, User Flow, ERD, 여행목적/지역) |

---

## 메모 / 결정 사항

> 작업 중 결정된 사항이나 참고할 내용을 여기에 기록해 주세요.
