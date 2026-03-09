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
import styles from "./page.module.scss";

// ============================================================
// Mock Data (추후 API로 교체)
// ============================================================
const SHARED_COURSES = [
  { id: "1", title: "제주 자연 힐링 코스", tags: ["자연", "힐링", "올레길"], region: "성산읍 · 제주시", duration: "2박 3일", author: "올레러버", likes: 54, cardColor: "#52B788" },
  { id: "2", title: "제주 미식 탐방 코스", tags: ["맛집", "카페", "흑돼지"], region: "제주시 · 서귀포시", duration: "2박 3일", author: "미식가", likes: 89, cardColor: "#862E9C" },
  { id: "3", title: "제주 액티비티 코스", tags: ["서핑", "카약", "스노클링"], region: "한림읍 · 애월읍", duration: "2박 3일", author: "액티비", likes: 67, cardColor: "#1971C2" },
];

const RECRUITING_COURSES = [
  { id: "1", title: "트레일러닝 제주 완주", tags: ["트레일", "러닝"], region: "한라산", duration: "1박 2일", author: "달리기왕", current: 2, max: 4, startDate: "3월 15일", cardColor: "#E67700" },
  { id: "2", title: "한라산 등반 같이 가요", tags: ["등산", "힐링"], region: "한라산", duration: "당일치기", author: "산악인", current: 1, max: 3, startDate: "3월 20일", cardColor: "#2D6A4F" },
  { id: "3", title: "애월 서핑 동행 모집", tags: ["서핑", "해양"], region: "애월읍", duration: "1박 2일", author: "서퍼", current: 3, max: 5, startDate: "3월 22일", cardColor: "#1971C2" },
];

const QUICK_MENUS = [
  { href: "/design", icon: RiCompass3Line, label: "코스설계" },
  { href: "/my-courses", icon: RiMapLine, label: "내 코스" },
  { href: "/board", icon: RiNewspaperLine, label: "게시판" },
  { href: "/chat", icon: RiMessage2Line, label: "채팅" },
];

// ============================================================
// Page
// ============================================================
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        // API 연결 불가 시 mock 유저로 폴백 (데모 모드)
        const mockUser = authStorage.getMockUser();
        if (mockUser) {
          setUser(mockUser);
        } else {
          authStorage.clear();
          router.push("/login");
        }
      });
  }, [router]);

  const initial = user?.nickname?.[0]?.toUpperCase() ?? "?";

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
            <span className={styles.statNum}>3</span>
            <span className={styles.statLabel}>내 코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>1</span>
            <span className={styles.statLabel}>공유중</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>1</span>
            <span className={styles.statLabel}>모집중</span>
          </div>
        </div>
      </div>

      {/* Quick menu */}
      <div className={styles.quickMenu}>
        {QUICK_MENUS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={styles.quickItem}>
            <div className={styles.quickIcon}>
              <Icon size={22} />
            </div>
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
          {SHARED_COURSES.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseCardThumb} style={{ background: `linear-gradient(135deg, ${course.cardColor}cc, ${course.cardColor})` }}>
                <div className={styles.courseCardTags}>
                  {course.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={styles.courseCardTag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.courseCardBody}>
                <p className={styles.courseCardTitle}>{course.title}</p>
                <div className={styles.courseCardMeta}>
                  <span><RiMapPinLine size={11} /> {course.region}</span>
                  <span><RiCalendarLine size={11} /> {course.duration}</span>
                </div>
                <div className={styles.courseCardFoot}>
                  <span className={styles.courseCardAuthor}>by {course.author}</span>
                  <span className={styles.courseCardLikes}><RiHeartLine size={12} /> {course.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 모집중인 코스 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>동행 모집중</h2>
          <Link href="/board" className={styles.sectionMore}>
            더보기 <RiArrowRightSLine size={16} />
          </Link>
        </div>
        <div className={styles.cardScroll}>
          {RECRUITING_COURSES.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseCardThumb} style={{ background: `linear-gradient(135deg, ${course.cardColor}cc, ${course.cardColor})` }}>
                <div className={styles.recruitBadge}>
                  <RiGroupLine size={12} /> {course.current}/{course.max}명
                </div>
                <div className={styles.courseCardTags}>
                  {course.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={styles.courseCardTag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.courseCardBody}>
                <p className={styles.courseCardTitle}>{course.title}</p>
                <div className={styles.courseCardMeta}>
                  <span><RiMapPinLine size={11} /> {course.region}</span>
                  <span><RiCalendarLine size={11} /> {course.startDate}</span>
                </div>
                <div className={styles.progressWrap}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${(course.current / course.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
