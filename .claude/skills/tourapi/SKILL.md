---
description: 한국관광공사 TourAPI(국문 관광정보 서비스)로 제주 관광지·음식점·숙박 데이터를 조회·적재하거나 backend/app/services/tour_api.py를 수정할 때 사용. "TourAPI", "관광공사 API", "관광지 데이터", "장소 적재", "contentTypeId", "지역코드" 요청 시 자동 매칭
---

# tourapi — 한국관광공사 TourAPI 가이드 (제주 전용)

TripMate-Jeju는 TourAPI로 관광지 DB(`places` 테이블)를 채우고, 음식점·숙소는 카카오 로컬 API로 실시간 보강한다.
관련 코드: `backend/app/services/tour_api.py`, `place_enricher.py`, `kakao_local.py`, `models/place.py`

## ⚠️ 먼저 확인할 것 — 현재 코드의 알려진 문제

`tour_api.py`는 구버전 기준으로 작성되어 있다. 수정 작업 전에 아래를 먼저 점검한다.

1. **서비스 버전**: 코드는 `KorService1` + `areaBasedList1` / `detailCommon1`을 쓴다.
   현재 서비스는 `KorService2`이며 오퍼레이션도 `areaBasedList2`, `detailCommon2`처럼 끝자리가 `2`로 바뀌었다.
2. **지역코드 이관**: TourAPI가 법정동 코드 체계로 옮겨가면서 제주 콘텐츠 상당수의 `areacode`/`sigungucode`가 **빈 값**이다.
   `areaCode=39`로만 조회하면 제주 데이터의 절반 이상이 누락될 수 있다 → `lDongRegnCd=50`으로 조회한다.
3. **시군구 코드 오류**: 코드의 `SIGUNGU_CODE`는 제주시=1, 서귀포시=2로 되어 있으나 구 체계에서 1·2는 남제주군·북제주군이다.
   법정동 체계 기준으로 교체한다.

수정 시에는 실제 API를 1회 호출해 응답의 필드명과 건수를 확인한 뒤 반영한다(공식 매뉴얼이 기준, 이 문서는 요약).

## 기본 정보

| 항목 | 값 |
|---|---|
| Base URL | `https://apis.data.go.kr/B551011/KorService2` |
| 키 | `TOUR_API_KEY` (backend `.env`, data.go.kr 발급) — 인코딩 키 사용 시 이중 인코딩 주의 |
| 필수 공통 파라미터 | `serviceKey`, `MobileOS=ETC`, `MobileApp=TripMateJeju`, `_type=json` |
| 페이지 | `numOfRows`(최대 1000 권장 이하), `pageNo` — 응답 `totalCount`로 전체 페이지 계산 |

## 제주 지역 코드

| 구분 | 신규(법정동) | 구 체계 |
|---|---|---|
| 제주특별자치도 | `lDongRegnCd=50` | `areaCode=39` |
| 제주시 | `lDongSignguCd=110` | — |
| 서귀포시 | `lDongSignguCd=130` | — |

읍·면(애월읍, 성산읍 등)은 TourAPI 시군구 단위가 아니다. 제주시/서귀포시로 조회한 뒤 `addr1` 주소 문자열로 필터링한다.
앱의 제주 지역 16곳 선택지 → 시(2개) + 주소 키워드로 매핑.

## contentTypeId

| 값 | 의미 | 앱 category |
|---|---|---|
| 12 | 관광지 | tourist |
| 14 | 문화시설 | tourist |
| 15 | 축제·공연·행사 | (미사용) |
| 25 | 여행코스 | (참고용) |
| 28 | 레포츠 | tourist |
| 32 | 숙박 | accommodation |
| 38 | 쇼핑 | (미사용) |
| 39 | 음식점 | restaurant |

## 주요 오퍼레이션

| 오퍼레이션 | 용도 | 핵심 파라미터 |
|---|---|---|
| `areaBasedList2` | 지역 기반 목록 | `lDongRegnCd`, `lDongSignguCd`, `contentTypeId`, `arrange` |
| `locationBasedList2` | 좌표 반경 검색 | `mapX`(경도), `mapY`(위도), `radius`(m) |
| `searchKeyword2` | 키워드 검색 | `keyword`, `lDongRegnCd` |
| `detailCommon2` | 공통 상세(개요·전화·이미지) | `contentId` |
| `detailIntro2` | 유형별 소개(영업시간 등) | `contentId`, `contentTypeId` |
| `detailImage2` | 추가 이미지 | `contentId` |

## 응답 → Place 모델 매핑

| TourAPI 필드 | Place 컬럼 | 비고 |
|---|---|---|
| `title` | `place_name` | |
| `addr1` | `address` | |
| `mapy` | `latitude` | 문자열 → float |
| `mapx` | `longitude` | 문자열 → float |
| `firstimage` | `place_image` | 빈 문자열 → None |
| `tel` | `phone_number` | 목록보다 `detailCommon2`가 정확 |
| `overview` | `description` | `detailCommon2`에서만 제공, HTML 태그 포함 가능 |
| `contentid` | (tour_id) | 중복 적재 방지 키로 사용 |

응답 파싱 주의: `response.body.items`가 결과 0건일 때 빈 문자열(`""`)로, 1건일 때 `item`이 dict로 온다. 항상 리스트로 정규화한다.

## 작업 규칙

- 기존 코드처럼 예외를 삼키고 `[]`를 반환하면 키 오류·이관 문제를 놓친다. 최소한 로그를 남긴다.
- 대량 적재는 `totalCount` 기준으로 페이지를 돌고, 적재 후 건수를 출력해 급감 여부를 확인한다.
- 음식점·숙소는 폐업 반영을 위해 카카오 로컬 API 우선 전략(`place_enricher.py`)을 유지한다.
- API 키는 커밋하지 않는다(`.env`는 gitignore됨).
