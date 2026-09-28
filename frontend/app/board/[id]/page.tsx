"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiMapPin2Line, RiRouteLine, RiCalendarLine,
  RiHeartLine, RiHeartFill, RiTimeLine, RiCarLine, RiGroupLine,
  RiRestaurantLine, RiCupLine, RiHome2Line, RiWalkLine,
  RiAnchorLine, RiRunLine, RiFlag2Line,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import { api, ApiError } from "@/lib/api";
import {
  COMPANION_AGE_LABELS, COMPANION_GENDER_LABELS,
  type CompanionPost, type Course, type CourseLikeStatus, type CoursePlace,
} from "@/lib/types";
import { authStorage, type UserResponse } from "@/lib/auth";
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

// course_places를 day별로 그룹화
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

export default function BoardDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [activeDay, setActiveDay] = useState(1);
  const [post, setPost] = useState<CompanionPost | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinDone, setJoinDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [like, setLike] = useState<CourseLikeStatus | null>(null);
  const [liking, setLiking] = useState(false);
  const [me, setMe] = useState<UserResponse | null>(null);

  const isCompanionPost = id.startsWith("p");
  const isSharedCourse = id.startsWith("c");
  const numericId = parseInt(id.slice(1), 10);

  useEffect(() => {
    setLoading(true);
    if (isCompanionPost) {
      Promise.all([
        api.get<CompanionPost>(`/api/companion/${numericId}`),
        api.get<Course>(`/api/companion/${numericId}/course`),
      ]).then(([p, c]) => {
        setPost(p);
        setCourse(c);
      }).catch(() => setError("게시글을 불러올 수 없습니다."))
        .finally(() => setLoading(false));
    } else if (isSharedCourse) {
      api.get<Course>(`/api/courses/${numericId}`)
        .then((c) => setCourse(c))
        .catch(() => setError("코스를 불러올 수 없습니다."))
        .finally(() => setLoading(false));
    } else {
      setError("잘못된 접근입니다.");
      setLoading(false);
    }
  }, [id, numericId, isCompanionPost, isSharedCourse]);

  useEffect(() => {
    if (!authStorage.getToken()) return;
    api.get<UserResponse>("/api/auth/me").then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (!course) return;
    setLike({ liked: false, like_count: course.like_count });
    if (!authStorage.getToken()) return;
    api.get<CourseLikeStatus>(`/api/courses/${course.id}/like`).then(setLike).catch(() => {});
  }, [course]);

  const handleLike = async () => {
    if (!course || !like || liking) return;
    if (!authStorage.getToken()) { router.push("/login"); return; }
    setLiking(true);
    try {
      const path = `/api/courses/${course.id}/like`;
      setLike(like.liked ? await api.delete<CourseLikeStatus>(path) : await api.post<CourseLikeStatus>(path, {}));
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setLiking(false);
    }
  };

  const handleJoin = async () => {
    const token = authStorage.getToken();
    if (!token) { router.push("/login"); return; }
    setJoining(true);
    try {
      await api.post(`/api/companion/${numericId}/join`, {});
      setJoinDone(true);
      // 현재 인원 갱신
      const updated = await api.get<CompanionPost>(`/api/companion/${numericId}`);
      setPost(updated);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>추천코스상세</span>
          <div className={styles.headerSpacer} />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>오류</span>
          <div className={styles.headerSpacer} />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>{error}</div>
      </div>
    );
  }

  const title = post?.title ?? course?.title ?? "-";
  const tags = course?.travel_style ? [course.travel_style] : [];
  const days = course ? groupByDay(course.course_places) : [];
  const currentDay = days[activeDay - 1] ?? [];
  const currentPeople = post?.current_people ?? 1;
  const maxPeople = post?.max_people ?? 0;
  const isClosed = post?.status === "completed"
    || (!!post?.recruit_deadline && post.recruit_deadline < new Date().toLocaleDateString("sv-SE"));
  const isFull = isCompanionPost ? currentPeople >= maxPeople || isClosed : false;
  const isMyPost = !!post && !!me && post.user_id === me.id;
  const fillPct = isCompanionPost ? Math.round((currentPeople / maxPeople) * 100) : 0;
  const deadline = post?.recruit_deadline ?? "-";
  const conditions = post
    ? [
        COMPANION_GENDER_LABELS[post.gender],
        post.age_groups.length ? post.age_groups.map((a) => COMPANION_AGE_LABELS[a]).join("·") : "연령 무관",
      ]
    : [];
  const duration = course?.duration_days ? `${course.duration_days}일` : "-";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>추천코스상세</span>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {/* Title + Tags */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
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
            <span>{course?.region ?? "-"}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiCalendarLine size={16} />
            <span>{duration}</span>
          </div>
          <div className={styles.statDivider} />
          <button
            type="button"
            className={`${styles.statItem} ${styles.likeBtn} ${like?.liked ? styles.liked : ""}`}
            onClick={handleLike}
            disabled={liking}
            aria-pressed={like?.liked ?? false}
            aria-label="좋아요"
          >
            {like?.liked ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
            <span>{like?.like_count ?? 0}</span>
          </button>
        </div>

        {/* 모집 현황 (companion post 전용) */}
        {isCompanionPost && post && (
          <div className={styles.recruitStrip}>
            <div className={styles.recruitLeft}>
              <RiGroupLine size={14} className={styles.recruitIcon} />
              <span className={styles.recruitText}>
                모집 현황 <strong>{currentPeople}/{maxPeople}명</strong>
              </span>
              {isFull && <span className={styles.fullBadge}>마감</span>}
            </div>
            <div className={styles.recruitRight}>
              <span className={styles.deadlineText}>마감 {deadline}</span>
            </div>
            <div className={styles.recruitBarWrap}>
              <div className={styles.recruitBar} style={{ width: `${fillPct}%` }} />
            </div>
            <div className={styles.recruitMeta}>
              {post.start_date && (
                <span>여행 {post.start_date}{post.end_date && post.end_date !== post.start_date ? ` ~ ${post.end_date}` : ""}</span>
              )}
              <span>{conditions.join(" · ")}</span>
            </div>
            {post.content && <p className={styles.recruitContent}>{post.content}</p>}
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
            <p style={{ color: "#868e96", textAlign: "center", padding: "1rem" }}>
              일정 정보가 없습니다
            </p>
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
                      </div>
                    )}
                  </div>
                  {i < currentDay.length - 1 && (
                    <div className={styles.transportRow}>
                      <RiCarLine size={15} />
                      <span>{course?.transport ?? "이동"}</span>
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
        {isMyPost ? (
          <button className={styles.btnNext} onClick={() => router.push(`/my-courses/${post.course_id}`)}>
            내 코스에서 관리
          </button>
        ) : isCompanionPost ? (
          <button
            className={`${styles.btnNext} ${isFull || joinDone ? styles.btnNextDisabled : ""}`}
            disabled={isFull || joinDone || joining}
            onClick={handleJoin}
          >
            {joinDone ? "신청 완료" : isFull ? "모집 마감" : joining ? "신청 중..." : "동행 신청하기"}
          </button>
        ) : (
          <button className={styles.btnNext} onClick={() => router.back()}>
            확인
          </button>
        )}
      </div>
    </div>
  );
}
