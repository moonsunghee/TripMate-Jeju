"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.scss";

const NAV_ITEMS = [
  {
    href: "/",
    label: "메인",
    icon: "/nav_home.svg",
    activeIcon: "/nav_home_active.svg",
  },
  {
    href: "/my-courses",
    label: "내코스",
    icon: "/nav_mycourse.svg",
    activeIcon: "/nav_mycourse_active.svg",
  },
  {
    href: "/design",
    label: "코스설계",
    icon: "/nav_makecourse.svg",
    activeIcon: "/nav_makecourse_active.svg",
    isCta: true,
  },
  {
    href: "/board",
    label: "동행모집",
    icon: "/nav_companion.svg",
    activeIcon: "/nav_companion_active.svg",
  },
  {
    href: "/chat",
    label: "채팅",
    icon: "/nav_chat.svg",
    activeIcon: "/nav_chat_active.svg",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ""} ${item.isCta ? styles.cta : ""}`}
          >
            <span className={styles.iconWrap}>
              <Image
                src={isActive ? item.activeIcon : item.icon}
                alt={item.label}
                width={24}
                height={24}
              />
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
