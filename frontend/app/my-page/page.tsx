"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiArrowLeftLine, RiArrowRightSLine,
  RiMapLine, RiNewspaperLine, RiMessage2Line, RiLogoutBoxRLine,
} from "react-icons/ri";
import { api } from "@/lib/api";
import { authStorage, type UserResponse } from "@/lib/auth";
import type { Course } from "@/lib/types";
import styles from "./page.module.scss";

const MENUS = [
  { href: "/my-courses", icon: RiMapLine, label: "내 코스" },
  { href: "/board", icon: RiNewspaperLine, label: "게시판" },
  { href: "/chat", icon: RiMessage2Line, label: "채팅" },
];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then((u) => {
        setUser(u);
        api.get<Course[]>("/api/courses/my").then(setMyCourses).catch(() => {});
      })
      .catch(() => {
        const mockUser = authStorage.getMockUser();
        if (mockUser) {
          setUser(mockUser);
        } else {
          authStorage.clear();
          router.push("/login");
        }
      });
  }, [router]);

  const handleLogout = () => {
    authStorage.clear();
    router.replace("/login");
  };

  const initial = user?.nickname?.[0]?.toUpperCase() ?? "?";
  const joinedAt = user ? new Date(user.created_at).toLocaleDateString("ko-KR") : "";
  const recruitingCount = myCourses.filter((c) => c.is_recruiting).length;
  const sharingCount = myCourses.filter((c) => c.is_shared && !c.is_recruiting).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로가기">
          <RiArrowLeftLine size={22} />
        </button>
        <h1 className={styles.headerTitle}>마이페이지</h1>
        <span className={styles.headerSpacer} />
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>{initial}</div>
        <p className={styles.nickname}>{user?.nickname ?? "..."}</p>
        <p className={styles.email}>{user?.email ?? ""}</p>
        {user?.bio && <p className={styles.bio}>{user.bio}</p>}
        {joinedAt && <p className={styles.joinedAt}>{joinedAt} 가입</p>}
        <Link href="/my-page/edit" className={styles.editBtn}>프로필 편집</Link>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{myCourses.length}</span>
            <span className={styles.statLabel}>내 코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{sharingCount}</span>
            <span className={styles.statLabel}>공유코스</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNum}>{recruitingCount}</span>
            <span className={styles.statLabel}>모집중</span>
          </div>
        </div>
      </div>

      <ul className={styles.menuList}>
        {MENUS.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link href={href} className={styles.menuItem}>
              <Icon size={20} className={styles.menuIcon} />
              <span className={styles.menuLabel}>{label}</span>
              <RiArrowRightSLine size={20} className={styles.menuArrow} />
            </Link>
          </li>
        ))}
      </ul>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <RiLogoutBoxRLine size={18} />
        로그아웃
      </button>
    </div>
  );
}
