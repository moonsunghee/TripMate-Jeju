"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiMapPin2Line, RiRouteLine, RiCalendarLine,
  RiHeartLine, RiTimeLine, RiCarLine, RiGroupLine,
  RiRestaurantLine, RiCupLine, RiHome2Line, RiWalkLine,
  RiAnchorLine, RiRunLine, RiFlag2Line, RiEditLine, RiShareLine,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import { api } from "@/lib/api";
import type { Course, CoursePlace } from "@/lib/types";
import KakaoMap from "@/components/KakaoMap";
import styles from "./page.module.scss";

const CATEGORY_ICONS: Record<string, IconType> = {
  조식: RiRestaurantLine, 중식: RiRestaurantLine, 석식: RiRestaurantLine, 야식: RiRestaurantLine,
  restaurant: RiRestaurantLine,
  디저트: RiCupLine, 카페: RiCupLine, dessert: RiCupLine,
  관광지: RiMapPin2Line, 관광: RiMapPin2Line, tourist: RiMapPin2Line,
  숙소: RiHome2Line, accommodation: RiHome2Line,
  트레킹: RiWalkLine, 등반: RiWalkLine,
  액티비티: RiAnchorLine, 서핑: RiAnchorLine, 카약: RiAnchorLine,
  러닝: RiRunLine, 트레일: RiRunLine,
  골프: RiFlag2Line,
};

const STATUS_LABEL: Record<string, string> = {
  draft: "임시저장", master: "Master", sharing: "공유중",
  recruiting: "모집중", completed: "모집완료", discarded: "폐기됨",
};

function groupByDay(places: CoursePlace[]): CoursePlace[][] {
  const map = new Map<number, CoursePlace[]>();
  for (const p of places) {
    if (!map.has(p.day)) map.set(p.day, []);
    map.get(p.day)!.push(p);
  }
  return Array.from(map.keys())
    .sort((a, b) => a - b)
    .map((d) => map.get(d)!.sort((a, b) => a.visit_order - b.visit_order));
}

export default function MyCourseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    api.get<Course>(`/api/courses/${id}/detail`)
      .then(setCourse)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>내 코스 상세</span>
          <span />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>로딩 중...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>오류</span>
          <span />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>코스를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const badgeStatus = course.is_recruiting ? "recruiting" : course.is_shared ? "sharing" : course.status;
  const tags = course.travel_style ? [course.travel_style] : [];
  const days = groupByDay(course.course_places);
  const currentDay = days[activeDay - 1] ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>내 코스 상세</span>
        <span className={`${styles.headerBadge} ${styles[`badge_${badgeStatus}`]}`}>
          {STATUS_LABEL[badgeStatus] ?? badgeStatus}
        </span>
      </div>

      <div className={styles.scroll}>
        {/* Title + Tags */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{course.title}</h1>
          <div className={styles.tagScroll}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Map */}
        <KakaoMap
          places={currentDay.map((p) => p.place_name ?? "")}
          className={styles.map}
        />

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <RiRouteLine size={16} />
            <span>{course.region ?? "-"}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiCalendarLine size={16} />
            <span>{course.duration_days ? `${course.duration_days}일` : "-"}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiHeartLine size={16} />
            <span>0</span>
          </div>
        </div>

        {/* 모집 현황 (is_recruiting 전용) */}
        {course.is_recruiting && (
          <div className={styles.recruitStrip}>
            <div className={styles.recruitLeft}>
              <RiGroupLine size={14} className={styles.recruitIcon} />
              <span className={styles.recruitText}>동행 모집중</span>
            </div>
          </div>
        )}

        {/* Day tabs */}
        {days.length > 0 && (
          <div className={styles.dayTabsSection}>
            <div className={styles.dayTabs}>
              {days.map((_, i) => {
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
        )}

        {/* Schedule */}
        <div className={styles.scheduleSection}>
          {currentDay.length === 0 && (
            <p style={{ color: "#868e96", textAlign: "center", padding: "1rem" }}>일정이 없습니다</p>
          )}
          {currentDay.map((item, i) => {
            const Icon = CATEGORY_ICONS[item.category ?? ""] ?? RiMapPin2Line;
            return (
              <div key={item.id} className={styles.scheduleRow}>
                <div className={styles.scheduleLeft}>
                  <div className={styles.scheduleNum}>{i + 1}</div>
                  {i < currentDay.length - 1 && <div className={styles.scheduleConn} />}
                </div>

                <div className={styles.scheduleRight}>
                  <div className={styles.scheduleCard}>
                    <div className={styles.scheduleCardTop}>
                      <div className={styles.scheduleCardCategory}>
                        <Icon size={17} />
                        <span>{item.category ?? "-"}</span>
                      </div>
                      <div className={styles.scheduleCardDuration}>
                        <RiTimeLine size={13} />
                        <span>{item.time ?? "-"}</span>
                      </div>
                    </div>
                    <div className={styles.scheduleCardAddrRow}>
                      <span className={styles.scheduleCardAddr}>{item.place_name ?? "-"}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => navigator.clipboard?.writeText(item.place_name ?? "")}
                      >복사</button>
                    </div>
                    {item.memo && (
                      <div className={styles.scheduleCardAddrRow}>
                        <span className={styles.scheduleCardAddr}>{item.memo}</span>
                        <button
                          className={styles.copyBtn}
                          onClick={() => navigator.clipboard?.writeText(item.memo ?? "")}
                        >복사</button>
                      </div>
                    )}
                  </div>

                  {i < currentDay.length - 1 && (
                    <div className={styles.transportRow}>
                      <RiCarLine size={15} />
                      <span>{course.transport ?? "이동"}</span>
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
