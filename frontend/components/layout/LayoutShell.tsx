"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import styles from "./LayoutShell.module.scss";

const HIDE_NAV_EXACT = ["/login", "/register", "/design"];
const HIDE_NAV_PREFIX = ["/chat/", "/board/"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav =
    !HIDE_NAV_EXACT.includes(pathname) &&
    !HIDE_NAV_PREFIX.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className={styles.shell}>
      <main className={`${styles.content} ${showNav ? styles.withNav : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
