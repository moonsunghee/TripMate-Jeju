"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import VisibilityPicker, { type CourseVisibility } from "./VisibilityPicker";
import styles from "./ShareSheet.module.scss";

export default function ShareSheet({ course, onClose, onShared }: {
  course: Pick<Course, "id" | "title"> | null;
  onClose: () => void;
  onShared: (course: Course) => void;
}) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<CourseVisibility>("sharing");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) setVisibility("sharing");
  }, [course]);

  if (!course) return null;

  const handleConfirm = async () => {
    if (visibility === "recruiting") {
      router.push(`/my-courses/${course.id}/recruit`);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put<Course>(`/api/courses/${course.id}`, {
        is_shared: true,
        is_recruiting: false,
        status: "sharing",
      });
      onShared(updated);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "공유에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-sheet-title" className={styles.title}>공유하기</h2>
        <p className={styles.courseName}>{course.title}</p>

        <VisibilityPicker value={visibility} onChange={setVisibility} values={["sharing", "recruiting"]} />

        <p className={styles.notice}>
          공유하거나 동행을 모집한 뒤에는 코스를 편집할 수 없고 삭제만 할 수 있어요.
        </p>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose} disabled={saving}>취소</button>
          <button className={styles.btnConfirm} onClick={handleConfirm} disabled={saving}>
            {saving ? "공유 중..." : visibility === "recruiting" ? "모집 조건 작성" : "공유하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
