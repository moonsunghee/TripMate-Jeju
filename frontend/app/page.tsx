"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiBellLine, RiArrowRightSLine,
  RiCompass3Line, RiMapLine, RiNewspaperLine, RiMessage2Line,
  RiHeartLine, RiMapPinLine, RiCalendarLine, RiGroupLine,
} from "react-icons/ri";
import { api } from "@/lib/api";
import { authStorage, type UserResponse } from "@/lib/auth";
import type { Course, CompanionPost } from "@/lib/types";
import styles from "./page.module.scss";

const QUICK_MENUS = [
  { href: "/design", icon: RiCompass3Line, label: "코스설계" },
  { href: "/my-courses", icon: RiMapLine, label: "내 코스" },
  { href: "/board", icon: RiNewspaperLine, label: "게시판" },
  { href: "/chat", icon: RiMessage2Line, label: "채팅" },
];

const STYLE_COLORS: Record<string, string> = {
  휴양: "#52B788", 등산: "#2D6A4F", 해양레포츠: "#1971C2", "트레일/러닝": "#E67700",
  제주올레: "#F59F00", 웰니스: "#7950F2", 골프: "#495057", 낚시: "#1098AD",
  자전거: "#D9480F", "가족(어린이)": "#F03E3E", "가족(부모님)": "#862E9C",
};
const DEFAULT_COLOR = "#52B788";
const getColor = (style: string | null) => STYLE_COLORS[style ?? ""] ?? DEFAULT_COLOR;

// ============================================================
// Page
// ============================================================
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [sharedCourses, setSharedCourses] = useState<Course[]>([]);
  const [recruitingPosts, setRecruitingPosts] = useState<CompanionPost[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then((u) => {
        setUser(u);
        // 내 코스 통계
        api.get<Course[]>("/api/courses/my").then(setMyCourses).catch(() => {});
      })
      .catch(() => {
        authStorage.clear();
        router.push("/intro");
      });

    // 공개 공유 코스
    api.get<Course[]>("/api/courses?size=5").then(setSharedCourses).catch(() => {});
    // 동행 모집 중인 게시글
    api.get<CompanionPost[]>("/api/companion?status=recruiting&size=5").then(setRecruitingPosts).catch(() => {});
  }, [router]);

  const initial = user?.nickname?.[0]?.toUpperCase() ?? "?";
  const totalCount = myCourses.length;
  const sharingCount = myCourses.filter((c) => c.is_shared).length;
  const recruitingCount = myCourses.filter((c) => c.is_recruiting).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerLogo}>TripMate Jeju</span>
        <button className={styles.bellBtn}>
          <RiBellLine size={22} />
          <span className={styles.bellDot} />
        </button>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.profileInfo}>
            <p className={styles.greeting}>안녕하세요 👋</p>
            <p className={styles.nickname}>{user?.nickname ?? "..."}님</p>
            <p className={styles.email}>{user?.email ?? ""}</p>
          </div>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{totalCount}</span>
            <span className={styles.statLabel}>내 코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{sharingCount}</span>
            <span className={styles.statLabel}>공유중</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{recruitingCount}</span>
            <span className={styles.statLabel}>모집중</span>
          </div>
        </div>
      </div>

      {/* Quick menu */}
      <div className={styles.quickMenu}>
        {QUICK_MENUS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={styles.quickItem}>
            <div className={styles.quickIcon}><Icon size={22} /></div>
            <span className={styles.quickLabel}>{label}</span>
          </Link>
        ))}
      </div>

      {/* 공유중인 추천코스 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>공유중인 추천코스</h2>
          <Link href="/board" className={styles.sectionMore}>
            더보기 <RiArrowRightSLine size={16} />
          </Link>
        </div>
        <div className={styles.cardScroll}>
          {sharedCourses.length === 0 && (
            <p className={styles.emptyHint}>공유된 코스가 없습니다</p>
          )}
          {sharedCourses.map((course) => {
            const color = getColor(course.travel_style);
            const tags = course.travel_style ? [course.travel_style] : [];
            const duration = course.duration_days ? `${course.duration_days}일` : "-";
            return (
              <Link key={course.id} href={`/board/c${course.id}`} className={styles.courseCard}>
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
                    <span className={styles.courseCardLikes}><RiHeartLine size={12} /> 0</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 동행 모집중 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>동행 모집중</h2>
          <Link href="/board" className={styles.sectionMore}>
            더보기 <RiArrowRightSLine size={16} />
          </Link>
        </div>
        <div className={styles.cardScroll}>
          {recruitingPosts.length === 0 && (
            <p className={styles.emptyHint}>모집 중인 게시글이 없습니다</p>
          )}
          {recruitingPosts.map((post) => {
            const color = DEFAULT_COLOR;
            const startDate = post.start_date ?? "-";
            return (
              <Link key={post.id} href={`/board/p${post.id}`} className={styles.courseCard}>
                <div className={styles.courseCardThumb} style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                  <div className={styles.recruitBadge}>
                    <RiGroupLine size={12} /> {post.current_people}/{post.max_people}명
                  </div>
                </div>
                <div className={styles.courseCardBody}>
                  <p className={styles.courseCardTitle}>{post.title}</p>
                  <div className={styles.courseCardMeta}>
                    <span><RiCalendarLine size={11} /> {startDate}</span>
                  </div>
                  <div className={styles.progressWrap}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${(post.current_people / post.max_people) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
