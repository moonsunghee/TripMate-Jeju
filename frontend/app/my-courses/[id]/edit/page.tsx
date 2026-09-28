"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiArrowLeftLine, RiArrowUpLine, RiArrowDownLine, RiDeleteBinLine, RiAddLine,
} from "react-icons/ri";
import { api, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import VisibilityPicker, { type CourseVisibility } from "@/components/VisibilityPicker";
import styles from "./page.module.scss";

const PLACE_CATEGORIES: [string, string][] = [
  ["tourist", "관광지"],
  ["restaurant", "식당"],
  ["dessert", "카페·디저트"],
  ["accommodation", "숙소"],
  ["nightfood", "야식"],
];

interface EditPlace {
  key: number;
  place_id: number | null;
  place_name: string;
  category: string;
  time: string;
  memo: string;
}

interface EditForm {
  title: string;
  description: string;
  visibility: CourseVisibility;
  days: EditPlace[][];
}

function toForm(course: Course, nextKey: () => number): EditForm {
  const dayCount = Math.max(course.duration_days ?? 1, ...course.course_places.map((p) => p.day), 1);
  const days: EditPlace[][] = Array.from({ length: dayCount }, () => []);
  [...course.course_places]
    .sort((a, b) => a.day - b.day || a.visit_order - b.visit_order)
    .forEach((p) => {
      days[p.day - 1].push({
        key: nextKey(),
        place_id: p.place_id,
        place_name: p.place_name ?? "",
        category: p.category ?? "tourist",
        time: p.time ?? "",
        memo: p.memo ?? "",
      });
    });
  return { title: course.title, description: course.description ?? "", visibility: "master", days };
}

export default function CourseEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const keySeq = useRef(0);
  const nextKey = () => ++keySeq.current;
  const [course, setCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Course>(`/api/courses/${courseId}/detail`)
      .then((c) => {
        if (c.is_shared || c.is_recruiting) {
          setError("공유 중이거나 모집 중인 코스는 편집할 수 없습니다.");
          return;
        }
        setCourse(c);
        setForm(toForm(c, () => ++keySeq.current));
      })
      .catch(() => setError("코스를 불러올 수 없습니다."));
  }, [courseId]);

  const updateDays = (fn: (days: EditPlace[][]) => EditPlace[][]) =>
    setForm((f) => (f ? { ...f, days: fn(f.days) } : f));

  const updatePlace = (index: number, patch: Partial<EditPlace>) =>
    updateDays((days) => days.map((day, di) =>
      di === activeDay ? day.map((p, i) => (i === index ? { ...p, ...patch } : p)) : day));

  const movePlace = (index: number, delta: number) =>
    updateDays((days) => days.map((day, di) => {
      if (di !== activeDay) return day;
      const target = index + delta;
      if (target < 0 || target >= day.length) return day;
      const next = [...day];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }));

  const removePlace = (index: number) =>
    updateDays((days) => days.map((day, di) => (di === activeDay ? day.filter((_, i) => i !== index) : day)));

  const addPlace = () =>
    updateDays((days) => days.map((day, di) => (di === activeDay
      ? [...day, { key: nextKey(), place_id: null, place_name: "", category: "tourist", time: "", memo: "" }]
      : day)));

  const addDay = () => {
    if (!form) return;
    updateDays((days) => [...days, []]);
    setActiveDay(form.days.length);
  };

  const removeDay = () => {
    if (!form || form.days.length <= 1) return;
    if (form.days[activeDay].length > 0 && !confirm(`${activeDay + 1}일차 일정을 모두 삭제할까요?`)) return;
    updateDays((days) => days.filter((_, di) => di !== activeDay));
    setActiveDay((d) => Math.max(0, Math.min(d, form.days.length - 2)));
  };

  const handleSave = async () => {
    if (!form || !course) return;
    if (!form.title.trim()) { alert("코스 이름을 입력해 주세요."); return; }
    const emptyDay = form.days.findIndex((day) => day.some((p) => !p.place_name.trim()));
    if (emptyDay >= 0) {
      setActiveDay(emptyDay);
      alert(`${emptyDay + 1}일차에 이름이 비어 있는 장소가 있어요.`);
      return;
    }

    const startRecruiting = form.visibility === "recruiting";
    const places = form.days.flatMap((day, di) => day.map((p, i) => ({
      place_id: p.place_id,
      place_name: p.place_name.trim(),
      category: p.category,
      time: p.time || null,
      memo: p.memo.trim() || null,
      day: di + 1,
      visit_order: i + 1,
    })));

    setSaving(true);
    try {
      await api.put<Course>(`/api/courses/${courseId}`, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration_days: form.days.length,
        is_shared: form.visibility === "sharing",
        is_recruiting: false,
        status: startRecruiting ? "master" : form.visibility,
        places,
      });
      router.replace(startRecruiting ? `/my-courses/${courseId}/recruit` : `/my-courses/${courseId}`);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로">
        <RiArrowLeftLine size={22} />
      </button>
      <span className={styles.headerTitle}>코스 편집</span>
    </div>
  );

  if (error || !form || !course) {
    return (
      <div className={styles.page}>
        {header}
        <p className={styles.message}>{error ?? "로딩 중..."}</p>
      </div>
    );
  }

  const places = form.days[activeDay] ?? [];

  return (
    <div className={styles.page}>
      {header}

      <div className={styles.scroll}>
        <section className={styles.field}>
          <label className={styles.label} htmlFor="course-title">코스 이름</label>
          <input
            id="course-title"
            className={styles.input}
            value={form.title}
            maxLength={50}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </section>

        <section className={styles.field}>
          <label className={styles.label} htmlFor="course-desc">코스 소개</label>
          <textarea
            id="course-desc"
            className={styles.textarea}
            value={form.description}
            maxLength={500}
            rows={3}
            placeholder="어떤 여행인지 간단히 소개해 주세요."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </section>

        <section className={styles.field}>
          <span className={styles.label}>일정</span>
          <div className={styles.dayTabs}>
            {form.days.map((day, di) => (
              <button
                key={di}
                type="button"
                className={`${styles.dayTab} ${activeDay === di ? styles.dayTabActive : ""}`}
                onClick={() => setActiveDay(di)}
              >
                {di + 1}일 <span className={styles.dayCount}>{day.length}</span>
              </button>
            ))}
            <button type="button" className={styles.dayAdd} onClick={addDay} aria-label="일차 추가">
              <RiAddLine size={16} /> 일차
            </button>
          </div>

          {places.length === 0 && <p className={styles.emptyDay}>아직 장소가 없어요.</p>}

          <ol className={styles.placeList}>
            {places.map((p, i) => (
              <li key={p.key} className={styles.placeItem}>
                <span className={styles.placeNum}>{i + 1}</span>
                <div className={styles.placeCard}>
                  <div className={styles.placeRow}>
                    <select
                      className={styles.select}
                      value={p.category}
                      onChange={(e) => updatePlace(i, { category: e.target.value })}
                      aria-label="장소 종류"
                    >
                      {!PLACE_CATEGORIES.some(([v]) => v === p.category) && (
                        <option value={p.category}>{p.category}</option>
                      )}
                      {PLACE_CATEGORIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                    <input
                      type="time"
                      className={styles.timeInput}
                      value={p.time}
                      onChange={(e) => updatePlace(i, { time: e.target.value })}
                      aria-label="방문 시간"
                    />
                    <div className={styles.placeActions}>
                      <button type="button" onClick={() => movePlace(i, -1)} disabled={i === 0} aria-label="위로">
                        <RiArrowUpLine size={16} />
                      </button>
                      <button type="button" onClick={() => movePlace(i, 1)} disabled={i === places.length - 1} aria-label="아래로">
                        <RiArrowDownLine size={16} />
                      </button>
                      <button type="button" className={styles.removeBtn} onClick={() => removePlace(i)} aria-label="장소 삭제">
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </div>
                  <input
                    className={styles.input}
                    value={p.place_name}
                    placeholder="장소 이름"
                    onChange={(e) => updatePlace(i, { place_name: e.target.value, place_id: null })}
                  />
                  <input
                    className={styles.input}
                    value={p.memo}
                    placeholder="메모 (선택)"
                    onChange={(e) => updatePlace(i, { memo: e.target.value })}
                  />
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.dayActions}>
            <button type="button" className={styles.addPlaceBtn} onClick={addPlace}>
              <RiAddLine size={16} /> 장소 추가
            </button>
            {form.days.length > 1 && (
              <button type="button" className={styles.removeDayBtn} onClick={removeDay}>
                {activeDay + 1}일차 삭제
              </button>
            )}
          </div>
        </section>

        <section className={styles.field}>
          <span className={styles.label}>공개 설정</span>
          <VisibilityPicker value={form.visibility} onChange={(visibility) => setForm({ ...form, visibility })} />
        </section>
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.btnCancel} onClick={() => router.back()} disabled={saving}>취소</button>
        <button className={styles.btnSubmit} onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
