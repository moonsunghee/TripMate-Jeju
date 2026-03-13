"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RiSearchLine, RiHeartLine, RiMessage2Line,
  RiMapPinLine, RiCalendarLine, RiGroupLine,
  RiArrowLeftSLine, RiArrowRightSLine,
} from "react-icons/ri";
import { api } from "@/lib/api";
import type { Course, CompanionPost } from "@/lib/types";
import styles from "./page.module.scss";

type PostType = "shared" | "recruiting";
type TabType = "all" | "shared" | "recruiting";
type SortType = "latest" | "popular";

interface UnifiedPost {
  id: string;   // "c{id}" for courses, "p{id}" for companion posts
  type: PostType;
  title: string;
  author: string;
  tags: string[];
  region: string;
  duration: string;
  date: string;
  comments: number;
  cardColor: string;
  current?: number;
  max?: number;
}

const STYLE_COLORS: Record<string, string> = {
  휴양: "#52B788", 등산: "#2D6A4F", 해양레포츠: "#1971C2", "트레일/러닝": "#E67700",
  제주올레: "#F59F00", 웰니스: "#7950F2", 골프: "#495057", 낚시: "#1098AD",
  자전거: "#D9480F", "가족(어린이)": "#F03E3E", "가족(부모님)": "#862E9C",
};
const getColor = (style: string | null) => STYLE_COLORS[style ?? ""] ?? "#52B788";

function courseToPost(c: Course): UnifiedPost {
  return {
    id: `c${c.id}`,
    type: "shared",
    title: c.title,
    author: c.user?.nickname ?? "-",
    tags: c.travel_style ? [c.travel_style] : [],
    region: c.region ?? "-",
    duration: c.duration_days ? `${c.duration_days}일` : "-",
    date: c.created_at.slice(0, 10),
    comments: 0,
    cardColor: getColor(c.travel_style),
  };
}

function companionToPost(p: CompanionPost): UnifiedPost {
  return {
    id: `p${p.id}`,
    type: "recruiting",
    title: p.title,
    author: p.user?.nickname ?? "-",
    tags: [],
    region: "-",
    duration: p.start_date && p.end_date
      ? `${p.start_date} ~ ${p.end_date}`
      : p.start_date ?? "-",
    date: p.created_at.slice(0, 10),
    comments: 0,
    cardColor: "#2D6A4F",
    current: p.current_people,
    max: p.max_people,
  };
}

const PAGE_SIZE = 6;

export default function BoardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sharedCourses, setSharedCourses] = useState<Course[]>([]);
  const [recruitingPosts, setRecruitingPosts] = useState<CompanionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Course[]>("/api/courses?size=50"),
      api.get<CompanionPost[]>("/api/companion?size=50"),
    ]).then(([courses, companions]) => {
      setSharedCourses(courses);
      setRecruitingPosts(companions);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allPosts = useMemo<UnifiedPost[]>(() => {
    const shared = sharedCourses.map(courseToPost);
    const recruiting = recruitingPosts.map(companionToPost);
    return [...shared, ...recruiting];
  }, [sharedCourses, recruitingPosts]);

  const filtered = useMemo(() => {
    let list = allPosts;
    if (tab === "shared") list = list.filter((p) => p.type === "shared");
    if (tab === "recruiting") list = list.filter((p) => p.type === "recruiting");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "popular") list = [...list].sort((a) => (a.type === "recruiting" ? -1 : 1));
    else list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [allPosts, tab, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (t: TabType) => { setTab(t); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>코스게시판</h1>
      </div>

      <div className={styles.searchWrap}>
        <RiSearchLine size={17} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="코스 제목, 태그 검색"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className={styles.filterBar}>
        <div className={styles.tabs}>
          {(["all", "shared", "recruiting"] as TabType[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => handleTabChange(t)}
            >
              {t === "all" ? "전체" : t === "shared" ? "공유중" : "모집중"}
            </button>
          ))}
        </div>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => { setSort(e.target.value as SortType); setPage(1); }}
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      <p className={styles.countText}>
        {loading ? "로딩 중..." : `총 ${filtered.length}개`}
      </p>

      <div className={styles.list}>
        {!loading && paginated.length === 0 && (
          <p className={styles.empty}>검색 결과가 없습니다</p>
        )}
        {paginated.map((post) => (
          <button
            key={post.id}
            className={styles.card}
            onClick={() => router.push(`/board/${post.id}`)}
          >
            <div className={styles.cardAccent} style={{ background: post.cardColor }} />
            <div className={styles.cardContent}>
              <div className={styles.cardTop}>
                <span className={`${styles.statusBadge} ${post.type === "shared" ? styles.badgeShared : styles.badgeRecruiting}`}>
                  {post.type === "shared" ? "공유중" : "모집중"}
                </span>
                {post.type === "recruiting" && (
                  <span className={styles.recruitCount}>
                    <RiGroupLine size={12} /> {post.current}/{post.max}명
                  </span>
                )}
                <span className={styles.cardDate}>{post.date}</span>
              </div>

              <p className={styles.cardTitle}>{post.title}</p>

              <div className={styles.cardTags}>
                {post.tags.map((tag) => (
                  <span key={tag} className={styles.cardTag}>#{tag}</span>
                ))}
              </div>

              <div className={styles.cardFoot}>
                <span className={styles.cardMeta}>
                  <span>{post.author}</span>
                  <span className={styles.dot}>·</span>
                  <RiMapPinLine size={12} />
                  <span>{post.region}</span>
                  <span className={styles.dot}>·</span>
                  <RiCalendarLine size={12} />
                  <span>{post.duration}</span>
                </span>
                <span className={styles.cardStats}>
                  <span><RiHeartLine size={13} /> 0</span>
                  <span><RiMessage2Line size={13} /> {post.comments}</span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <RiArrowLeftSLine size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`${styles.pageNum} ${page === n ? styles.pageNumActive : ""}`}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className={styles.pageBtn}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <RiArrowRightSLine size={18} />
        </button>
      </div>
    </div>
  );
}
