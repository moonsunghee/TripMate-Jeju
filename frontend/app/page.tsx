"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiBellLine, RiArrowRightSLine, RiSearchLine, RiEqualizerLine,
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

function RecommendedCarousel({ courses }: { courses: Course[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>추천코스</h2>
        <Link href="/board" className={styles.sectionMore}>
          더보기 <RiArrowRightSLine size={16} />
        </Link>
      </div>
      {courses.length === 0 ? (
        <p className={styles.emptyHint}>추천할 코스가 없습니다</p>
      ) : (
        <>
          <div ref={trackRef} className={styles.carousel} onScroll={handleScroll}>
            {courses.map((course) => {
              const color = getColor(course.travel_style);
              return (
                <Link key={course.id} href={`/board/c${course.id}`} className={styles.slide}>
                  <div className={styles.slideThumb} style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                    <span className={`${styles.slideBadge} ${course.is_recruiting ? styles.slideBadgeRecruiting : ""}`}>
                      {course.is_recruiting ? "모집코스" : "공유코스"}
                    </span>
                    {course.travel_style && <span className={styles.courseCardTag}>{course.travel_style}</span>}
                  </div>
                  <div className={styles.slideBody}>
                    <p className={styles.slideTitle}>{course.title}</p>
                    <div className={styles.slideMeta}>
                      <span><RiMapPinLine size={12} /> {course.region ?? "-"}</span>
                      <span><RiCalendarLine size={12} /> {course.duration_days ? `${course.duration_days}일` : "-"}</span>
                    </div>
                    <div className={styles.courseCardFoot}>
                      <span className={styles.courseCardAuthor}>by {course.user?.nickname ?? "-"}</span>
                      <span className={styles.courseCardLikes}><RiHeartLine size={12} /> {course.like_count}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {courses.length > 1 && (
            <div className={styles.dots}>
              {courses.map((course, i) => (
                <button
                  key={course.id}
                  className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}번째 코스`}
                />
              ))}
            </div>
          )}
        </>
      )}
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then((u) => {
        setUser(u);
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
  const myRecruiting = myCourses.filter((c) => c.is_recruiting);
  const mySharing = myCourses.filter((c) => c.is_shared && !c.is_recruiting);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/board?q=${encodeURIComponent(q)}` : "/board");
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroText}>
            <p className={styles.greeting}>안녕하세요, {user?.nickname ?? "..."}님 👋</p>
            <h1 className={styles.headline}>어디로 떠나볼까요?</h1>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.bellBtn} aria-label="알림">
              <RiBellLine size={22} />
              <span className={styles.bellDot} />
            </button>
            <Link href="/my-page" className={styles.avatar} aria-label="마이페이지">
              {initial}
            </Link>
          </div>
        </div>

        <div className={styles.searchRow}>
          <form className={styles.searchBox} onSubmit={handleSearch}>
            <RiSearchLine size={18} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="코스 제목, 태그 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
          </form>
          <Link href="/board" className={styles.filterBtn} aria-label="게시판 필터">
            <RiEqualizerLine size={20} />
          </Link>
        </div>
      </div>

      <RecommendedCarousel courses={recommendedCourses} />
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
