"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiHome2Line, RiHome2Fill,
  RiNewspaperLine, RiNewspaperFill,
  RiCompass3Line, RiCompass3Fill,
  RiMapLine, RiMapFill,
  RiMessage2Line, RiMessage2Fill,
} from "react-icons/ri";
import styles from "./BottomNav.module.scss";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: RiHome2Line,
    activeIcon: RiHome2Fill,
  },
  {
    href: "/board",
    label: "코스게시판",
    icon: RiNewspaperLine,
    activeIcon: RiNewspaperFill,
  },
  {
    href: "/design",
    label: "코스설계",
    icon: RiCompass3Line,
    activeIcon: RiCompass3Fill,
    isCta: true,
  },
  {
    href: "/my-courses",
    label: "내코스",
    icon: RiMapLine,
    activeIcon: RiMapFill,
  },
  {
    href: "/chat",
    label: "채팅",
    icon: RiMessage2Line,
    activeIcon: RiMessage2Fill,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.activeIcon : item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ""} ${item.isCta ? styles.cta : ""}`}
          >
            <span className={styles.iconWrap}>
              <Icon size={24} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
