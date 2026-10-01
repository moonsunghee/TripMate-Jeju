"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiBellLine, RiArrowRightSLine, RiUser3Line,
  RiHeartLine, RiMapPinLine, RiCalendarLine,
} from "react-icons/ri";
import { api } from "@/lib/api";
import { authStorage, type UserResponse } from "@/lib/auth";
import type { Course } from "@/lib/types";
import styles from "./page.module.scss";

const STYLE_COLORS: Record<string, string> = {
  휴양: "#52B788", 등산: "#2D6A4F", 해양레포츠: "#1971C2", "트레일/러닝": "#E67700",
  제주올레: "#F59F00", 웰니스: "#7950F2", 골프: "#495057", 낚시: "#1098AD",
  자전거: "#D9480F", "가족(어린이)": "#F03E3E", "가족(부모님)": "#862E9C",
};
const DEFAULT_COLOR = "#52B788";
const getColor = (style: string | null) => STYLE_COLORS[style ?? ""] ?? DEFAULT_COLOR;

function CourseCard({ course, href }: { course: Course; href: string }) {
  const color = getColor(course.travel_style);
  const tags = course.travel_style ? [course.travel_style] : [];
  const duration = course.duration_days ? `${course.duration_days}일` : "-";
  return (
    <Link href={href} className={styles.courseCard}>
      <div className={styles.courseCardThumb} style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
        <div className={styles.courseCardTags}>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className={styles.courseCardTag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className={styles.courseCardBody}>
        <p className={styles.courseCardTitle}>{course.title}</p>
        <div className={styles.courseCardMeta}>
          <span><RiMapPinLine size={11} /> {course.region ?? "-"}</span>
          <span><RiCalendarLine size={11} /> {duration}</span>
        </div>
        <div className={styles.courseCardFoot}>
          <span className={styles.courseCardAuthor}>by {course.user?.nickname ?? "-"}</span>
          <span className={styles.courseCardLikes}><RiHeartLine size={12} /> {course.like_count}</span>
        </div>
      </div>
    </Link>
  );
}

function CourseSection({ title, moreHref, emptyText, courses, hrefOf }: {
  title: string;
  moreHref: string;
  emptyText: string;
  courses: Course[];
  hrefOf: (course: Course) => string;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <Link href={moreHref} className={styles.sectionMore}>
          더보기 <RiArrowRightSLine size={16} />
        </Link>
      </div>
      <div className={styles.cardScroll}>
        {courses.length === 0 && <p className={styles.emptyHint}>{emptyText}</p>}
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} href={hrefOf(course)} />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Page
// ============================================================
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then((u) => {
        setUser(u);
        // 내 코스 통계
        api.get<Course[]>("/api/courses/my").then(setMyCourses).catch(() => {});
        api.get<Course[]>("/api/courses/recommended?size=5").then(setRecommendedCourses).catch(() => {});
      })
      .catch(() => {
        const mockUser = authStorage.getMockUser();
        if (mockUser) {
          setUser(mockUser);
        } else {
          authStorage.clear();
          router.push("/intro");
        }
      });
  }, [router]);

  const initial = user?.nickname?.[0]?.toUpperCase() ?? "?";
  const totalCount = myCourses.length;
  const myRecruiting = myCourses.filter((c) => c.is_recruiting);
  const mySharing = myCourses.filter((c) => c.is_shared && !c.is_recruiting);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerLogo}>TripMate Jeju</span>
        <div className={styles.headerActions}>
          <button className={styles.bellBtn}>
            <RiBellLine size={22} />
            <span className={styles.bellDot} />
          </button>
          <Link href="/my-page" className={styles.bellBtn} aria-label="마이페이지">
            <RiUser3Line size={22} />
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <Link href="/my-page" className={styles.profileLeft}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.profileInfo}>
            <p className={styles.greeting}>안녕하세요 👋</p>
            <p className={styles.nickname}>{user?.nickname ?? "..."}님</p>
            <p className={styles.email}>{user?.email ?? ""}</p>
          </div>
          <RiArrowRightSLine size={20} className={styles.profileArrow} />
        </Link>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalCount}</span>
            <span className={styles.statLabel}>내 코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{mySharing.length}</span>
            <span className={styles.statLabel}>공유코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{myRecruiting.length}</span>
            <span className={styles.statLabel}>모집중</span>
          </div>
        </div>
      </div>

      <CourseSection
        title="공유중인 추천코스"
        moreHref="/board"
        emptyText="추천할 코스가 없습니다"
        courses={recommendedCourses}
        hrefOf={(c) => `/board/c${c.id}`}
      />
      <CourseSection
        title="동행모집중"
        moreHref="/my-courses"
        emptyText="모집 중인 코스가 없습니다"
        courses={myRecruiting}
        hrefOf={(c) => `/my-courses/${c.id}`}
      />
      <CourseSection
        title="코스공유중"
        moreHref="/my-courses"
        emptyText="공유 중인 코스가 없습니다"
        courses={mySharing}
        hrefOf={(c) => `/my-courses/${c.id}`}
      />
    </div>
  );
}
