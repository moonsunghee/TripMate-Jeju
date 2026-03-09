"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  RiSearchLine, RiHeartLine, RiMessage2Line,
  RiMapPinLine, RiCalendarLine, RiGroupLine,
  RiArrowLeftSLine, RiArrowRightSLine,
} from "react-icons/ri";
import styles from "./page.module.scss";

// ============================================================
// Types & Mock Data
// ============================================================
type PostType = "shared" | "recruiting";

interface CoursePost {
  id: string;
  type: PostType;
  title: string;
  author: string;
  tags: string[];
  region: string;
  duration: string;
  date: string;
  likes: number;
  comments: number;
  cardColor: string;
  current?: number;
  max?: number;
}

const MOCK_POSTS: CoursePost[] = [
  { id: "1",  type: "shared",     title: "제주 자연 힐링 코스 — 성산일출봉부터 협재까지", author: "올레러버", tags: ["자연", "힐링", "올레길"], region: "성산읍", duration: "2박 3일", date: "2026-03-08", likes: 54, comments: 12, cardColor: "#52B788" },
  { id: "2",  type: "recruiting", title: "한라산 등반 같이 가요! 초보도 환영", author: "산악인", tags: ["등산", "한라산"], region: "한라산", duration: "당일치기", date: "2026-03-08", likes: 31, comments: 8, cardColor: "#2D6A4F", current: 1, max: 3 },
  { id: "3",  type: "shared",     title: "제주 미식 탐방 — 흑돼지부터 한치물회까지", author: "미식가", tags: ["맛집", "카페", "흑돼지"], region: "제주시", duration: "2박 3일", date: "2026-03-07", likes: 89, comments: 23, cardColor: "#862E9C" },
  { id: "4",  type: "recruiting", title: "애월 서핑 동행 모집 3월 22일 출발", author: "서퍼킹", tags: ["서핑", "해양스포츠"], region: "애월읍", duration: "1박 2일", date: "2026-03-07", likes: 27, comments: 6, cardColor: "#1971C2", current: 3, max: 5 },
  { id: "5",  type: "shared",     title: "제주 올레길 7코스 완주기", author: "걷기좋아", tags: ["올레길", "트레킹", "자연"], region: "서귀포시", duration: "당일치기", date: "2026-03-06", likes: 42, comments: 9, cardColor: "#F59F00" },
  { id: "6",  type: "recruiting", title: "트레일러닝 제주 오름 투어 같이해요", author: "달리기왕", tags: ["트레일", "러닝", "오름"], region: "제주시", duration: "1박 2일", date: "2026-03-06", likes: 18, comments: 4, cardColor: "#E67700", current: 2, max: 4 },
  { id: "7",  type: "shared",     title: "가족 여행 완벽 코스 — 아이와 함께 제주", author: "가족맘", tags: ["가족", "어린이", "힐링"], region: "서귀포시", duration: "3박 4일", date: "2026-03-05", likes: 76, comments: 31, cardColor: "#F03E3E" },
  { id: "8",  type: "recruiting", title: "골프 동반자 구합니다 3월 말 예정", author: "골퍼", tags: ["골프", "스포츠"], region: "서귀포시", duration: "2박 3일", date: "2026-03-05", likes: 11, comments: 2, cardColor: "#495057", current: 1, max: 4 },
  { id: "9",  type: "shared",     title: "웰니스 힐링 여행 — 스파와 명상의 3일", author: "힐링러", tags: ["웰니스", "스파", "힐링"], region: "서귀포시", duration: "2박 3일", date: "2026-03-04", likes: 63, comments: 17, cardColor: "#7950F2" },
  { id: "10", type: "recruiting", title: "카약 & 스노클링 당일 투어 모집", author: "바다사랑", tags: ["카약", "스노클링", "해양"], region: "한림읍", duration: "당일치기", date: "2026-03-04", likes: 22, comments: 5, cardColor: "#1098AD", current: 2, max: 6 },
  { id: "11", type: "shared",     title: "자전거로 제주 일주 7일 완주 후기", author: "자전거맨", tags: ["자전거", "일주", "도전"], region: "제주 전체", duration: "6박 7일", date: "2026-03-03", likes: 112, comments: 44, cardColor: "#D9480F" },
  { id: "12", type: "recruiting", title: "낚시 고수 & 초보 함께 — 추자도 원정", author: "낚시왕", tags: ["낚시", "추자도", "바다"], region: "추자도", duration: "1박 2일", date: "2026-03-03", likes: 14, comments: 3, cardColor: "#364FC7", current: 1, max: 3 },
];

const PAGE_SIZE = 6;

type TabType = "all" | "shared" | "recruiting";
type SortType = "latest" | "popular";

// ============================================================
// Page
// ============================================================
export default function BoardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = MOCK_POSTS;

    if (tab !== "all") list = list.filter((p) => p.type === (tab === "shared" ? "shared" : "recruiting"));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "popular") list = [...list].sort((a, b) => b.likes - a.likes);

    return list;
  }, [tab, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (t: TabType) => { setTab(t); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>코스게시판</h1>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <RiSearchLine size={17} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="코스 제목, 태그 검색"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Filter bar */}
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

      {/* Count */}
      <p className={styles.countText}>총 {filtered.length}개</p>

      {/* List */}
      <div className={styles.list}>
        {paginated.length === 0 && (
          <p className={styles.empty}>검색 결과가 없습니다</p>
        )}
        {paginated.map((post) => (
          <button
            key={post.id}
            className={styles.card}
            onClick={() => router.push(`/board/${post.id}`)}
          >
            {/* Left accent bar */}
            <div className={styles.cardAccent} style={{ background: post.cardColor }} />

            {/* Content */}
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
                  <span><RiHeartLine size={13} /> {post.likes}</span>
                  <span><RiMessage2Line size={13} /> {post.comments}</span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
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
