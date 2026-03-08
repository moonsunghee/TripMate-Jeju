"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiOutlineHome,
  HiClipboardDocumentList,
  HiOutlineClipboardDocumentList,
  HiPencilSquare,
  HiOutlinePencilSquare,
  HiMap,
  HiOutlineMap,
  HiChatBubbleLeftRight,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import styles from "./BottomNav.module.scss";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: HiOutlineHome,
    activeIcon: HiHome,
  },
  {
    href: "/board",
    label: "코스게시판",
    icon: HiOutlineClipboardDocumentList,
    activeIcon: HiClipboardDocumentList,
  },
  {
    href: "/design",
    label: "코스설계",
    icon: HiOutlinePencilSquare,
    activeIcon: HiPencilSquare,
    isCta: true,
  },
  {
    href: "/my-courses",
    label: "내코스",
    icon: HiOutlineMap,
    activeIcon: HiMap,
  },
  {
    href: "/chat",
    label: "채팅",
    icon: HiOutlineChatBubbleLeftRight,
    activeIcon: HiChatBubbleLeftRight,
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
