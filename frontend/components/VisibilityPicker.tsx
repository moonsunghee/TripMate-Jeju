import styles from "./VisibilityPicker.module.scss";

export type CourseVisibility = "master" | "sharing" | "recruiting";

const OPTIONS: { value: CourseVisibility; label: string; hint: string }[] = [
  { value: "master", label: "나만보기", hint: "내 코스에만 저장돼요." },
  { value: "sharing", label: "코스 공유", hint: "게시판에 노출되지만 동행은 모집하지 않아요." },
  { value: "recruiting", label: "동행 모집", hint: "게시판에 공유하고 함께 여행할 동행도 모집해요." },
];

export default function VisibilityPicker({ value, onChange, values }: {
  value: CourseVisibility;
  onChange: (value: CourseVisibility) => void;
  values?: CourseVisibility[];
}) {
  const options = values ? OPTIONS.filter((opt) => values.includes(opt.value)) : OPTIONS;
  return (
    <div className={styles.group} role="radiogroup" aria-label="공개 설정">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${styles.visibilityCard} ${selected ? styles.visibilityCardSelected : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <span className={styles.visibilityDot} />
            <span className={styles.visibilityInfo}>
              <span className={styles.visibilityLabel}>{opt.label}</span>
              <span className={styles.visibilityHint}>{opt.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
