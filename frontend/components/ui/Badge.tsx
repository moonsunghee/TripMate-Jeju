import styles from "./Badge.module.scss";

export type BadgeVariant =
  | "master"
  | "recruiting"
  | "joined"
  | "closed"
  | "draft";

const BADGE_LABELS: Record<BadgeVariant, string> = {
  master: "Master",
  recruiting: "모집중",
  joined: "합류팀",
  closed: "모집완료",
  draft: "임시저장",
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export default function Badge({ variant, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className ?? ""}`}>
      {BADGE_LABELS[variant]}
    </span>
  );
}
