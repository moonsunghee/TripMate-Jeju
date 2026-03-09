"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiMapPin2Line, RiRouteLine, RiCalendarLine,
  RiHeartLine, RiTimeLine, RiCarLine, RiGroupLine,
  RiRestaurantLine, RiCupLine, RiHome2Line, RiWalkLine,
  RiAnchorLine, RiRunLine, RiFlag2Line,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import styles from "./page.module.scss";

// ============================================================
// Types & Constants
// ============================================================
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

interface PostDetail {
  id: string;
  title: string;
  tags: string[];
  distance: string;
  duration: string;
  likes: number;
  current: number;
  max: number;
  deadline: string;
  days: DayData[];
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

const MOCK_DETAILS: Record<string, PostDetail> = {
  "2": {
    id: "2", title: "한라산 등반 같이 가요! 초보도 환영",
    tags: ["등산", "한라산", "도전"],
    distance: "9.6km", duration: "당일치기", likes: 31,
    current: 1, max: 3, deadline: "2026-03-18",
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
  "4": {
    id: "4", title: "애월 서핑 동행 모집 3월 22일 출발",
    tags: ["서핑", "해양스포츠", "액티비티"],
    distance: "18km", duration: "1박 2일", likes: 27,
    current: 3, max: 5, deadline: "2026-03-20",
    days: [
      {
        items: [
          { category: "조식", place: "제주공항 카페", duration: "30분", address: "제주 제주시 공항로 2" },
          { category: "서핑", place: "곽지 서핑 스쿨", duration: "5시간", address: "제주 제주시 애월읍 곽지리 1566" },
          { category: "카페", place: "애월 해안도로 카페", duration: "1.5시간", address: "제주 제주시 애월읍 애월리" },
          { category: "석식", place: "애월 해산물 식당", duration: "1시간", address: "제주 제주시 애월읍 애월리 2519" },
          { category: "숙소", place: "애월 게스트하우스", duration: "12시간", address: "제주 제주시 애월읍" },
        ],
        transports: ["45min", "20min", "15min", "10min"],
      },
      {
        items: [
          { category: "조식", place: "게스트하우스 조식", duration: "1시간", address: "제주 제주시 애월읍" },
          { category: "관광지", place: "협재해수욕장", duration: "2시간", address: "제주 제주시 한림읍 협재리 2497-1" },
          { category: "중식", place: "한림 수산시장", duration: "1시간", address: "제주 제주시 한림읍 한림로 27" },
          { category: "관광지", place: "제주공항", duration: "30분", address: "제주 제주시 공항로 2" },
        ],
        transports: ["25min", "15min", "35min"],
      },
    ],
  },
  "6": {
    id: "6", title: "트레일러닝 제주 오름 투어 같이해요",
    tags: ["트레일", "러닝", "오름"],
    distance: "24km", duration: "1박 2일", likes: 18,
    current: 2, max: 4, deadline: "2026-03-19",
    days: [
      {
        items: [
          { category: "조식", place: "제주시 카페", duration: "30분", address: "제주 제주시 연동" },
          { category: "트레일", place: "새별오름", duration: "2시간", address: "제주 제주시 애월읍 봉성리 산59-8" },
          { category: "트레일", place: "다랑쉬오름", duration: "2시간", address: "제주 제주시 구좌읍 세화리 산6" },
          { category: "중식", place: "구좌읍 식당", duration: "1시간", address: "제주 제주시 구좌읍" },
          { category: "숙소", place: "제주시 게스트하우스", duration: "12시간", address: "제주 제주시" },
        ],
        transports: ["30min", "40min", "20min", "45min"],
      },
      {
        items: [
          { category: "조식", place: "게스트하우스 조식", duration: "30분", address: "제주 제주시" },
          { category: "트레일", place: "용눈이오름", duration: "2시간", address: "제주 제주시 구좌읍 종달리 산28" },
          { category: "관광지", place: "성산일출봉", duration: "1.5시간", address: "제주 서귀포시 성산읍 일출로 284-12" },
          { category: "중식", place: "성산 해녀의 집", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 78" },
        ],
        transports: ["35min", "30min", "15min"],
      },
    ],
  },
  "8": {
    id: "8", title: "골프 동반자 구합니다 3월 말 예정",
    tags: ["골프", "스포츠"],
    distance: "15km", duration: "2박 3일", likes: 11,
    current: 1, max: 4, deadline: "2026-03-23",
    days: [
      {
        items: [
          { category: "조식", place: "클럽하우스 레스토랑", duration: "1시간", address: "제주 서귀포시 안덕면" },
          { category: "골프", place: "핀크스 골프클럽", duration: "5시간", address: "제주 서귀포시 안덕면 산록남로 863" },
          { category: "석식", place: "서귀포 흑돼지 거리", duration: "1.5시간", address: "제주 서귀포시 동문로 15" },
          { category: "숙소", place: "서귀포 리조트", duration: "12시간", address: "제주 서귀포시 중앙로 85" },
        ],
        transports: ["10min", "30min", "15min"],
      },
      {
        items: [
          { category: "조식", place: "리조트 조식", duration: "1시간", address: "제주 서귀포시 중앙로 85" },
          { category: "골프", place: "제주 CC", duration: "5시간", address: "제주 서귀포시 남원읍 수망리 산 116-1" },
          { category: "석식", place: "남원 해산물 식당", duration: "1.5시간", address: "제주 서귀포시 남원읍" },
          { category: "숙소", place: "서귀포 리조트", duration: "12시간", address: "제주 서귀포시 중앙로 85" },
        ],
        transports: ["25min", "40min", "20min"],
      },
      {
        items: [
          { category: "조식", place: "리조트 조식", duration: "1시간", address: "제주 서귀포시 중앙로 85" },
          { category: "관광지", place: "천지연폭포", duration: "1.5시간", address: "제주 서귀포시 천지동 667-7" },
          { category: "중식", place: "서귀포 올레시장", duration: "1시간", address: "제주 서귀포시 중앙로 62번길 18" },
        ],
        transports: ["15min", "10min"],
      },
    ],
  },
  "10": {
    id: "10", title: "카약 & 스노클링 당일 투어 모집",
    tags: ["카약", "스노클링", "해양"],
    distance: "8km", duration: "당일치기", likes: 22,
    current: 2, max: 6, deadline: "2026-03-23",
    days: [
      {
        items: [
          { category: "조식", place: "한림항 카페", duration: "30분", address: "제주 제주시 한림읍 한림로 269" },
          { category: "카약", place: "한림항 카약 투어", duration: "3시간", address: "제주 제주시 한림읍 한림리 142-8" },
          { category: "중식", place: "한림 해산물 식당", duration: "1시간", address: "제주 제주시 한림읍 한림로 300" },
          { category: "액티비티", place: "금능 스노클링", duration: "2시간", address: "제주 제주시 한림읍 금능리 119-10" },
          { category: "카페", place: "협재 카페", duration: "1시간", address: "제주 제주시 한림읍 협재리 2500" },
        ],
        transports: ["5min", "10min", "15min", "20min"],
      },
    ],
  },
  "12": {
    id: "12", title: "낚시 고수 & 초보 함께 — 추자도 원정",
    tags: ["낚시", "추자도", "바다"],
    distance: "5km", duration: "1박 2일", likes: 14,
    current: 1, max: 3, deadline: "2026-03-22",
    days: [
      {
        items: [
          { category: "조식", place: "제주항 편의점", duration: "30분", address: "제주 제주시 임항로 111" },
          { category: "관광지", place: "추자도 여객선 탑승", duration: "1시간 30분", address: "제주 제주시 임항로 111" },
          { category: "액티비티", place: "추자도 낚시 포인트", duration: "5시간", address: "제주 제주시 추자면" },
          { category: "석식", place: "추자도 민박 식당", duration: "1시간", address: "제주 제주시 추자면 영흥리" },
          { category: "숙소", place: "추자도 민박", duration: "12시간", address: "제주 제주시 추자면 영흥리" },
        ],
        transports: ["도보 10min", "선박 1시간30분", "도보 5min", "도보 5min"],
      },
      {
        items: [
          { category: "조식", place: "민박 조식", duration: "30분", address: "제주 제주시 추자면 영흥리" },
          { category: "액티비티", place: "추자도 낚시 (오전)", duration: "3시간", address: "제주 제주시 추자면" },
          { category: "관광지", place: "추자도 여객선 귀환", duration: "1시간 30분", address: "제주 제주시 임항로 111" },
        ],
        transports: ["도보 5min", "선박 1시간30분"],
      },
    ],
  },
};

function buildFallback(id: string): PostDetail {
  return {
    id, title: "모집 코스", tags: ["제주"],
    distance: "-", duration: "-", likes: 0,
    current: 1, max: 4, deadline: "-",
    days: [
      { items: [{ category: "관광지", place: "준비 중", duration: "-", address: "-" }], transports: [] },
    ],
  };
}

// ============================================================
// Page
// ============================================================
export default function BoardDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const post = MOCK_DETAILS[id] ?? buildFallback(id);

  const [activeDay, setActiveDay] = useState(1);

  const isFull = post.current >= post.max;
  const fillPct = Math.round((post.current / post.max) * 100);
  const currentDay = post.days[activeDay - 1];
  const items = currentDay?.items ?? [];
  const transports = currentDay?.transports ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>추천코스상세</span>
        <div className={styles.headerSpacer} />
      </div>

      {/* Scrollable content */}
      <div className={styles.scroll}>

        {/* Title + Tags */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.tagScroll}>
            {post.tags.map((tag) => (
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
            <span>{post.distance}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiCalendarLine size={16} />
            <span>{post.duration}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiHeartLine size={16} />
            <span>{post.likes}</span>
          </div>
        </div>

        {/* Recruit status strip */}
        <div className={styles.recruitStrip}>
          <div className={styles.recruitLeft}>
            <RiGroupLine size={14} className={styles.recruitIcon} />
            <span className={styles.recruitText}>
              모집 현황 <strong>{post.current}/{post.max}명</strong>
            </span>
            {isFull && <span className={styles.fullBadge}>마감</span>}
          </div>
          <div className={styles.recruitRight}>
            <span className={styles.deadlineText}>마감 {post.deadline}</span>
          </div>
          <div className={styles.recruitBarWrap}>
            <div className={styles.recruitBar} style={{ width: `${fillPct}%` }} />
          </div>
        </div>

        {/* Day tabs */}
        <div className={styles.dayTabsSection}>
          <div className={styles.dayTabs}>
            {post.days.map((_, i) => {
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
                {/* Left: number + connector */}
                <div className={styles.scheduleLeft}>
                  <div className={styles.scheduleNum}>{i + 1}</div>
                  {i < items.length - 1 && <div className={styles.scheduleConn} />}
                </div>

                {/* Right: card + transport */}
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
        <button className={styles.btnPrev} onClick={() => router.back()}>취소</button>
        <button
          className={`${styles.btnNext} ${isFull ? styles.btnNextDisabled : ""}`}
          disabled={isFull}
        >
          {isFull ? "모집 마감" : "동행 신청하기"}
        </button>
      </div>
    </div>
  );
}
