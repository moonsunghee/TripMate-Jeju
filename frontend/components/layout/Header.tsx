"use client";

import { useRouter } from "next/navigation";
import { HiOutlineChevronLeft, HiOutlineEllipsisVertical } from "react-icons/hi2";
import styles from "./Header.module.scss";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}

export default function Header({
  title,
  showBack = false,
  rightElement,
  onBack,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className={`${styles.header} ${transparent ? styles.transparent : ""}`}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.iconBtn} onClick={handleBack} aria-label="뒤로가기">
            <HiOutlineChevronLeft size={24} />
          </button>
        )}
      </div>

      {title && <h1 className={styles.title}>{title}</h1>}

      <div className={styles.right}>
        {rightElement}
      </div>
    </header>
  );
}

export function HeaderMenuBtn({ onClick }: { onClick?: () => void }) {
  return (
    <button className={styles.iconBtn} onClick={onClick} aria-label="메뉴">
      <HiOutlineEllipsisVertical size={24} />
    </button>
  );
}
