"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Newspaper,
  Compass,
  MapTrifold,
  ChatCircle,
} from "@phosphor-icons/react";
import styles from "./BottomNav.module.scss";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: House,
  },
  {
    href: "/board",
    label: "코스게시판",
    icon: Newspaper,
  },
  {
    href: "/design",
    label: "코스설계",
    icon: Compass,
    isCta: true,
  },
  {
    href: "/my-courses",
    label: "내코스",
    icon: MapTrifold,
  },
  {
    href: "/chat",
    label: "채팅",
    icon: ChatCircle,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ""} ${item.isCta ? styles.cta : ""}`}
          >
            <span className={styles.iconWrap}>
              <Icon
                size={24}
                weight={isActive ? "fill" : "regular"}
              />
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
