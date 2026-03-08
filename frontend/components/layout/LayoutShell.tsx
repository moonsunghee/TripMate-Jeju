"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import styles from "./LayoutShell.module.scss";

const HIDE_NAV_PATHS = ["/login", "/register", "/design"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !HIDE_NAV_PATHS.includes(pathname);

  return (
    <div className={styles.shell}>
      <main className={`${styles.content} ${showNav ? styles.withNav : ""}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
