"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddLine, RiHeartLine, RiMessage2Line,
  RiMapPinLine, RiCalendarLine, RiGroupLine,
  RiEditLine, RiDeleteBinLine, RiShareLine,
  RiMoreLine, RiArrowRightSLine,
} from "react-icons/ri";
import styles from "./page.module.scss";

// ============================================================
// Types & Mock Data
// ============================================================
type CourseStatus = "draft" | "shared" | "recruiting";

interface MyCourse {
  id: string;
  title: string;
  tags: string[];
  region: string;
  duration: string;
  days: number;
  status: CourseStatus;
  cardColor: string;
  likes: number;
  comments: number;
  current?: number;
  max?: number;
  updatedAt: string;
}

const MOCK_MY_COURSES: MyCourse[] = [
  {
    id: "1",
    title: "제주 자연 힐링 코스 — 성산일출봉부터 협재까지",
    tags: ["자연", "힐링", "올레길"],
    region: "성산읍 · 제주시",
    duration: "2박 3일",
    days: 3,
    status: "shared",
    cardColor: "#52B788",
    likes: 54,
    comments: 12,
    updatedAt: "2026-03-08",
  },
  {
    id: "2",
    title: "한라산 등반 동행 모집",
    tags: ["등산", "한라산", "도전"],
    region: "한라산",
    duration: "당일치기",
    days: 1,
    status: "recruiting",
    cardColor: "#2D6A4F",
    likes: 31,
    comments: 8,
    current: 1,
    max: 3,
    updatedAt: "2026-03-07",
  },
  {
    id: "3",
    title: "제주 미식 탐방 — 흑돼지부터 한치물회까지",
    tags: ["맛집", "카페", "흑돼지"],
    region: "제주시 · 서귀포시",
    duration: "2박 3일",
    days: 3,
    status: "draft",
    cardColor: "#862E9C",
    likes: 0,
    comments: 0,
    updatedAt: "2026-03-05",
  },
];

const TABS = [
  { key: "all", label: "전체" },
  { key: "shared", label: "공유중" },
  { key: "recruiting", label: "모집중" },
  { key: "draft", label: "임시저장" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_LABEL: Record<CourseStatus, string> = {
  shared: "공유중",
  recruiting: "모집중",
  draft: "임시저장",
};

// ============================================================
// Page
// ============================================================
export default function MyCoursesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return MOCK_MY_COURSES;
    return MOCK_MY_COURSES.filter((c) => c.status === tab);
  }, [tab]);

  const counts = useMemo(() => ({
    all: MOCK_MY_COURSES.length,
    shared: MOCK_MY_COURSES.filter((c) => c.status === "shared").length,
    recruiting: MOCK_MY_COURSES.filter((c) => c.status === "recruiting").length,
    draft: MOCK_MY_COURSES.filter((c) => c.status === "draft").length,
  }), []);

  const toggleMenu = (id: string) => {
    setMenuOpen((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.page} onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>내 코스</h1>
        <button
          className={styles.addBtn}
          onClick={() => router.push("/design")}
        >
          <RiAddLine size={20} />
          <span>새 코스</span>
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{counts.all}</span>
          <span className={styles.statLabel}>전체</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>{counts.shared}</span>
          <span className={styles.statLabel}>공유중</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>{counts.recruiting}</span>
          <span className={styles.statLabel}>모집중</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>{counts.draft}</span>
          <span className={styles.statLabel}>임시저장</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`${styles.tabCount} ${tab === key ? styles.tabCountActive : ""}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>코스가 없습니다</p>
            <button
              className={styles.emptyBtn}
              onClick={() => router.push("/design")}
            >
              AI로 코스 만들기 <RiArrowRightSLine size={16} />
            </button>
          </div>
        )}

        {filtered.map((course) => (
          <div
            key={course.id}
            className={styles.card}
            onClick={() => {
              setMenuOpen(null);
              router.push(`/my-courses/${course.id}`);
            }}
          >
            {/* Thumbnail */}
            <div
              className={styles.thumb}
              style={{ background: `linear-gradient(135deg, ${course.cardColor}cc, ${course.cardColor})` }}
            >
              <div className={styles.thumbTags}>
                {course.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className={styles.thumbTag}>{tag}</span>
                ))}
              </div>
              <div className={styles.thumbMeta}>
                <span>{course.days}일 코스</span>
              </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
              {/* Top row: badge + more button */}
              <div className={styles.bodyTop}>
                <span className={`${styles.badge} ${styles[`badge_${course.status}`]}`}>
                  {STATUS_LABEL[course.status]}
                </span>
                {course.status === "recruiting" && course.current !== undefined && (
                  <span className={styles.recruitCount}>
                    <RiGroupLine size={11} /> {course.current}/{course.max}명
                  </span>
                )}
                <div className={styles.moreWrap} onClick={(e) => e.stopPropagation()}>
                  <button
                    className={styles.moreBtn}
                    onClick={() => toggleMenu(course.id)}
                  >
                    <RiMoreLine size={18} />
                  </button>
                  {menuOpen === course.id && (
                    <div className={styles.dropdown}>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { router.push(`/design?edit=${course.id}`); setMenuOpen(null); }}
                      >
                        <RiEditLine size={15} /> 편집
                      </button>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => { alert("공유 기능 준비 중"); setMenuOpen(null); }}
                      >
                        <RiShareLine size={15} /> 공유하기
                      </button>
                      <button
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                        onClick={() => { alert(`코스 "${course.title}" 삭제`); setMenuOpen(null); }}
                      >
                        <RiDeleteBinLine size={15} /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <p className={styles.title}>{course.title}</p>

              {/* Meta */}
              <div className={styles.meta}>
                <span><RiMapPinLine size={11} /> {course.region}</span>
                <span><RiCalendarLine size={11} /> {course.duration}</span>
              </div>

              {/* Footer */}
              <div className={styles.foot}>
                <span className={styles.updatedAt}>{course.updatedAt} 수정</span>
                {course.status !== "draft" && (
                  <span className={styles.stats}>
                    <span><RiHeartLine size={12} /> {course.likes}</span>
                    <span><RiMessage2Line size={12} /> {course.comments}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
