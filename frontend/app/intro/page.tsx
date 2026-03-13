"use client";

import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

export default function IntroPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      {/* Decorative background blobs */}
      <div className={styles.blobTopLeft} />
      <div className={styles.blobBottomRight} />

      {/* Floating circles */}
      <div className={`${styles.floatCircle} ${styles.circleLg} ${styles.circleCenter}`}>
        <div className={styles.circleInner} />
      </div>
      <div className={`${styles.floatCircle} ${styles.circleSm} ${styles.circleTopLeft}`}>
        <div className={styles.circleInner} />
      </div>
      <div className={`${styles.floatCircle} ${styles.circleMd} ${styles.circleTopRight}`}>
        <div className={styles.circleInner} />
      </div>
      <div className={`${styles.floatCircle} ${styles.circleSm} ${styles.circleBottomRight}`}>
        <div className={styles.circleInner} />
      </div>

      {/* Tripmate badge */}
      <div className={styles.badge}>
        <div className={styles.badgeAvatar} />
        <div>
          <p className={styles.badgeName}>Tripmate</p>
          <p className={styles.badgeStar}>★ 5,0</p>
        </div>
      </div>

      {/* Cloud shapes */}
      <div className={`${styles.cloud} ${styles.cloudLeft}`} />
      <div className={`${styles.cloud} ${styles.cloudRight}`} />

      {/* Decorative dots */}
      <div className={`${styles.dot} ${styles.dotDark}`} />
      <div className={`${styles.dot} ${styles.dotBlue}`} />
      <div className={`${styles.dot} ${styles.dotGreen}`} />

      {/* Text content */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          Trip Mate<br />in JEJU
        </h1>
        <p className={styles.subtitle}>
          Keep hiking anywhere without<br />any hassle.
        </p>
        <button
          className={styles.startBtn}
          onClick={() => router.push("/login")}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
