"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddLine, RiHeartLine, RiMessage2Line,
  RiMapPinLine, RiCalendarLine, RiGroupLine,
  RiEditLine, RiDeleteBinLine, RiShareLine,
  RiMoreLine, RiArrowRightSLine,
} from "react-icons/ri";
import { api, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import styles from "./page.module.scss";

type TabKey = "all" | "sharing" | "recruiting" | "draft";

const TABS = [
  { key: "all" as TabKey, label: "전체" },
  { key: "sharing" as TabKey, label: "공유중" },
  { key: "recruiting" as TabKey, label: "모집중" },
  { key: "draft" as TabKey, label: "임시저장" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "임시저장", master: "Master", sharing: "공유중", recruiting: "모집중",
  completed: "모집완료", discarded: "폐기됨",
};

const STYLE_COLORS: Record<string, string> = {
  휴양: "#52B788", 등산: "#2D6A4F", 해양레포츠: "#1971C2", "트레일/러닝": "#E67700",
  제주올레: "#F59F00", 웰니스: "#7950F2", 골프: "#495057", 낚시: "#1098AD",
  자전거: "#D9480F", "가족(어린이)": "#F03E3E", "가족(부모님)": "#862E9C",
};
const getColor = (style: string | null) => STYLE_COLORS[style ?? ""] ?? "#52B788";

export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  useEffect(() => {
    api.get<Course[]>("/api/courses/my")
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return courses;
    if (tab === "sharing") return courses.filter((c) => c.is_shared && !c.is_recruiting);
    if (tab === "recruiting") return courses.filter((c) => c.is_recruiting);
    if (tab === "draft") return courses.filter((c) => c.status === "draft");
    return courses;
  }, [courses, tab]);

  const counts = useMemo(() => ({
    all: courses.length,
    sharing: courses.filter((c) => c.is_shared && !c.is_recruiting).length,
    recruiting: courses.filter((c) => c.is_recruiting).length,
    draft: courses.filter((c) => c.status === "draft").length,
  }), [courses]);

  const handleDelete = async (courseId: number, title: string) => {
    if (!confirm(`코스 "${title}"을 삭제할까요?`)) return;
    try {
      await api.delete(`/api/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
    setMenuOpen(null);
  };

  return (
    <div className={styles.page} onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>내 코스</h1>
        <button className={styles.addBtn} onClick={() => router.push("/design")}>
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
          <span className={styles.statNum}>{counts.sharing}</span>
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
        {loading && (
          <p style={{ textAlign: "center", color: "#868e96", padding: "2rem" }}>로딩 중...</p>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyText}>코스가 없습니다</p>
            <button className={styles.emptyBtn} onClick={() => router.push("/design")}>
              AI로 코스 만들기 <RiArrowRightSLine size={16} />
            </button>
          </div>
        )}

        {filtered.map((course) => {
          const color = getColor(course.travel_style);
          const tags = course.travel_style ? [course.travel_style] : [];
          const badgeStatus = course.is_recruiting ? "recruiting" : course.is_shared ? "sharing" : course.status;

          return (
            <div
              key={course.id}
              className={styles.card}
              onClick={() => { setMenuOpen(null); router.push(`/my-courses/${course.id}`); }}
            >
              {/* Thumbnail */}
              <div className={styles.thumb} style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}>
                <div className={styles.thumbTags}>
                  {tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={styles.thumbTag}>{tag}</span>
                  ))}
                </div>
                <div className={styles.thumbMeta}>
                  <span>{course.duration_days ?? 1}일 코스</span>
                </div>
              </div>

              {/* Body */}
              <div className={styles.body}>
                <div className={styles.bodyTop}>
                  <span className={`${styles.badge} ${styles[`badge_${badgeStatus}`]}`}>
                    {STATUS_LABEL[badgeStatus] ?? badgeStatus}
                  </span>
                  {course.is_recruiting && (
                    <span className={styles.recruitCount}>
                      <RiGroupLine size={11} /> 모집중
                    </span>
                  )}
                  <div className={styles.moreWrap} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.moreBtn} onClick={() => setMenuOpen((prev) => (prev === course.id ? null : course.id))}>
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
                          onClick={() => handleDelete(course.id, course.title)}
                        >
                          <RiDeleteBinLine size={15} /> 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className={styles.title}>{course.title}</p>

                <div className={styles.meta}>
                  <span><RiMapPinLine size={11} /> {course.region ?? "-"}</span>
                  <span><RiCalendarLine size={11} /> {course.duration_days ? `${course.duration_days}일` : "-"}</span>
                </div>

                <div className={styles.foot}>
                  <span className={styles.updatedAt}>{(course.updated_at ?? course.created_at).slice(0, 10)} 수정</span>
                  {course.status !== "draft" && (
                    <span className={styles.stats}>
                      <span><RiHeartLine size={12} /> 0</span>
                      <span><RiMessage2Line size={12} /> 0</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
