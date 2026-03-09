"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiMapPin2Line, RiRouteLine, RiCalendarLine,
  RiHeartLine, RiTimeLine, RiCarLine, RiGroupLine,
  RiRestaurantLine, RiCupLine, RiHome2Line, RiWalkLine,
  RiAnchorLine, RiRunLine, RiFlag2Line, RiEditLine, RiShareLine,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import styles from "./page.module.scss";

// ============================================================
// Types & Constants
// ============================================================
type CourseStatus = "draft" | "shared" | "recruiting";

interface ScheduleItem {
  category: string;
  place: string;
  duration: string;
  address: string;
}

interface DayData {
  items: ScheduleItem[];
  transports: string[];
}

interface MyCourseDetail {
  id: string;
  title: string;
  tags: string[];
  region: string;
  distance: string;
  duration: string;
  days: DayData[];
  status: CourseStatus;
  likes: number;
  current?: number;
  max?: number;
  deadline?: string;
}

const CATEGORY_ICONS: Record<string, IconType> = {
  조식: RiRestaurantLine, 중식: RiRestaurantLine, 석식: RiRestaurantLine, 야식: RiRestaurantLine,
  디저트: RiCupLine, 카페: RiCupLine,
  관광지: RiMapPin2Line, 관광: RiMapPin2Line,
  숙소: RiHome2Line,
  트레킹: RiWalkLine, 등반: RiWalkLine,
  액티비티: RiAnchorLine, 서핑: RiAnchorLine, 카약: RiAnchorLine,
  러닝: RiRunLine, 트레일: RiRunLine,
  골프: RiFlag2Line,
};

const MOCK_MY_COURSE_DETAILS: Record<string, MyCourseDetail> = {
  "1": {
    id: "1",
    title: "제주 자연 힐링 코스 — 성산일출봉부터 협재까지",
    tags: ["자연", "힐링", "올레길"],
    region: "성산읍 · 제주시",
    distance: "42km",
    duration: "2박 3일",
    status: "shared",
    likes: 54,
    days: [
      {
        items: [
          { category: "조식", place: "성산 해녀의 집", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 78" },
          { category: "관광지", place: "성산일출봉", duration: "2시간", address: "제주 서귀포시 성산읍 일출로 284-12" },
          { category: "중식", place: "성산포 수산시장", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 219" },
          { category: "관광지", place: "섭지코지", duration: "1.5시간", address: "제주 서귀포시 성산읍 고성리 127" },
          { category: "숙소", place: "서귀포 게스트하우스", duration: "12시간", address: "제주 서귀포시 중앙로 85" },
        ],
        transports: ["15분", "도보 10분", "10분", "25분"],
      },
      {
        items: [
          { category: "조식", place: "서귀포 올레시장", duration: "1시간", address: "제주 서귀포시 중앙로 62번길 18" },
          { category: "트레킹", place: "올레길 7코스", duration: "4시간", address: "제주 서귀포시 외돌개 일대" },
          { category: "중식", place: "중문 흑돼지 거리", duration: "1.5시간", address: "제주 서귀포시 중문동" },
          { category: "관광지", place: "천제연폭포", duration: "1시간", address: "제주 서귀포시 중문동 2624-1" },
          { category: "숙소", place: "제주시 게스트하우스", duration: "12시간", address: "제주 제주시 연동" },
        ],
        transports: ["도보 5분", "30분", "10분", "25분"],
      },
      {
        items: [
          { category: "조식", place: "제주시 카페", duration: "1시간", address: "제주 제주시 연동" },
          { category: "관광지", place: "한림공원", duration: "1.5시간", address: "제주 제주시 한림읍 한림로 300" },
          { category: "관광지", place: "협재해수욕장", duration: "2시간", address: "제주 제주시 한림읍 협재리 2497-1" },
          { category: "중식", place: "한림 해산물 식당", duration: "1시간", address: "제주 제주시 한림읍 한림로 27" },
        ],
        transports: ["20분", "5분", "15분"],
      },
    ],
  },
  "2": {
    id: "2",
    title: "한라산 등반 동행 모집",
    tags: ["등산", "한라산", "도전"],
    region: "한라산",
    distance: "9.6km",
    duration: "당일치기",
    status: "recruiting",
    likes: 31,
    current: 1,
    max: 3,
    deadline: "2026-03-18",
    days: [
      {
        items: [
          { category: "조식", place: "성판악 편의점", duration: "30분", address: "제주 제주시 조천읍 교래리 산220" },
          { category: "관광지", place: "속밭 대피소", duration: "2시간", address: "한라산 해발 1,400m" },
          { category: "관광지", place: "한라산 정상 (백록담)", duration: "1시간", address: "한라산 해발 1,950m" },
          { category: "중식", place: "진달래밭 대피소", duration: "1시간", address: "한라산 해발 1,500m" },
          { category: "관광지", place: "성판악 탐방안내소", duration: "2.5시간", address: "제주 제주시 조천읍 교래리 산220-1" },
        ],
        transports: ["도보 2시간", "도보 1시간", "도보 30분", "도보 2시간"],
      },
    ],
  },
  "3": {
    id: "3",
    title: "제주 미식 탐방 — 흑돼지부터 한치물회까지",
    tags: ["맛집", "카페", "흑돼지"],
    region: "제주시 · 서귀포시",
    distance: "35km",
    duration: "2박 3일",
    status: "draft",
    likes: 0,
    days: [
      {
        items: [
          { category: "조식", place: "제주 공항 근처 카페", duration: "1시간", address: "제주 제주시 용담이동" },
          { category: "중식", place: "제주 흑돼지 거리", duration: "1.5시간", address: "제주 제주시 연동 흑돼지 골목" },
          { category: "카페", place: "월정리 카페", duration: "2시간", address: "제주 제주시 구좌읍 월정리 33-3" },
          { category: "석식", place: "한치물회 맛집", duration: "1.5시간", address: "제주 제주시 이도이동" },
          { category: "숙소", place: "제주시 호텔", duration: "12시간", address: "제주 제주시 노형동" },
        ],
        transports: ["20분", "45분", "30분", "15분"],
      },
      {
        items: [
          { category: "조식", place: "성산 해녀의 집", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 78" },
          { category: "카페", place: "카멜리아힐 카페", duration: "2시간", address: "제주 서귀포시 안덕면 병악로 166" },
          { category: "중식", place: "서귀포 갈치조림 명가", duration: "1.5시간", address: "제주 서귀포시 서귀동" },
          { category: "카페", place: "서귀포 카카오 프렌즈", duration: "1시간", address: "제주 서귀포시 안덕면 사계리 62-3" },
          { category: "숙소", place: "서귀포 리조트", duration: "12시간", address: "제주 서귀포시 중앙로 85" },
        ],
        transports: ["40분", "25분", "30분", "10분"],
      },
      {
        items: [
          { category: "조식", place: "서귀포 올레시장 국수", duration: "1시간", address: "제주 서귀포시 중앙로 62번길 18" },
          { category: "카페", place: "이니스프리 제주하우스", duration: "1.5시간", address: "제주 서귀포시 안덕면 서광리 41-1" },
          { category: "중식", place: "한림 수산시장 해산물", duration: "1.5시간", address: "제주 제주시 한림읍 한림로 27" },
        ],
        transports: ["30분", "25분"],
      },
    ],
  },
};

function buildFallback(id: string): MyCourseDetail {
  return {
    id, title: "내 코스", tags: ["제주"],
    region: "-", distance: "-", duration: "-", status: "draft", likes: 0,
    days: [
      { items: [{ category: "관광지", place: "준비 중", duration: "-", address: "-" }], transports: [] },
    ],
  };
}

const STATUS_LABEL: Record<CourseStatus, string> = {
  shared: "공유중",
  recruiting: "모집중",
  draft: "임시저장",
};

// ============================================================
// Page
// ============================================================
export default function MyCourseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const course = MOCK_MY_COURSE_DETAILS[id] ?? buildFallback(id);

  const [activeDay, setActiveDay] = useState(1);

  const isRecruiting = course.status === "recruiting";
  const isFull = isRecruiting && course.current !== undefined && course.max !== undefined
    ? course.current >= course.max
    : false;
  const fillPct = isRecruiting && course.current !== undefined && course.max !== undefined
    ? Math.round((course.current / course.max) * 100)
    : 0;

  const currentDay = course.days[activeDay - 1];
  const items = currentDay?.items ?? [];
  const transports = currentDay?.transports ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>내 코스 상세</span>
        <span className={`${styles.headerBadge} ${styles[`badge_${course.status}`]}`}>
          {STATUS_LABEL[course.status]}
        </span>
      </div>

      {/* Scrollable content */}
      <div className={styles.scroll}>

        {/* Title + Tags */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{course.title}</h1>
          <div className={styles.tagScroll}>
            {course.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Map placeholder */}
        <div className={styles.map}>
          <RiMapPin2Line size={28} className={styles.mapIcon} />
          <p className={styles.mapText}>지도</p>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <RiRouteLine size={16} />
            <span>{course.distance}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiCalendarLine size={16} />
            <span>{course.duration}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiHeartLine size={16} />
            <span>{course.likes}</span>
          </div>
        </div>

        {/* Recruit status strip (recruiting only) */}
        {isRecruiting && (
          <div className={styles.recruitStrip}>
            <div className={styles.recruitLeft}>
              <RiGroupLine size={14} className={styles.recruitIcon} />
              <span className={styles.recruitText}>
                모집 현황 <strong>{course.current}/{course.max}명</strong>
              </span>
              {isFull && <span className={styles.fullBadge}>마감</span>}
            </div>
            <div className={styles.recruitRight}>
              <span className={styles.deadlineText}>마감 {course.deadline}</span>
            </div>
            <div className={styles.recruitBarWrap}>
              <div className={styles.recruitBar} style={{ width: `${fillPct}%` }} />
            </div>
          </div>
        )}

        {/* Day tabs */}
        <div className={styles.dayTabsSection}>
          <div className={styles.dayTabs}>
            {course.days.map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  className={`${styles.dayTab} ${activeDay === day ? styles.dayTabActive : ""}`}
                  onClick={() => setActiveDay(day)}
                >
                  {day}일
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div className={styles.scheduleSection}>
          {items.map((item, i) => {
            const Icon = CATEGORY_ICONS[item.category];
            return (
              <div key={i} className={styles.scheduleRow}>
                <div className={styles.scheduleLeft}>
                  <div className={styles.scheduleNum}>{i + 1}</div>
                  {i < items.length - 1 && <div className={styles.scheduleConn} />}
                </div>

                <div className={styles.scheduleRight}>
                  <div className={styles.scheduleCard}>
                    <div className={styles.scheduleCardTop}>
                      <div className={styles.scheduleCardCategory}>
                        {Icon && <Icon size={17} />}
                        <span>{item.category}</span>
                      </div>
                      <div className={styles.scheduleCardDuration}>
                        <RiTimeLine size={13} />
                        <span>{item.duration}</span>
                      </div>
                    </div>
                    <div className={styles.scheduleCardAddrRow}>
                      <span className={styles.scheduleCardAddr}>{item.place}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => navigator.clipboard?.writeText(item.place)}
                      >복사</button>
                    </div>
                    <div className={styles.scheduleCardAddrRow}>
                      <span className={styles.scheduleCardAddr}>{item.address}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => navigator.clipboard?.writeText(item.address)}
                      >복사</button>
                    </div>
                  </div>

                  {i < items.length - 1 && (
                    <div className={styles.transportRow}>
                      <RiCarLine size={15} />
                      <span>{transports[i]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.bottomSpacer} />
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <button
          className={styles.btnEdit}
          onClick={() => router.push(`/design?edit=${course.id}`)}
        >
          <RiEditLine size={16} />
          편집
        </button>
        <button
          className={styles.btnShare}
          onClick={() => alert("공유 기능 준비 중")}
        >
          <RiShareLine size={16} />
          {course.status === "draft" ? "공유하기" : "공유 관리"}
        </button>
      </div>
    </div>
  );
}
