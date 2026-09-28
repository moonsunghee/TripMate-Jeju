"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiArrowLeftLine, RiAddLine, RiSubtractLine } from "react-icons/ri";
import { api, ApiError } from "@/lib/api";
import { authStorage, type UserResponse } from "@/lib/auth";
import {
  COMPANION_AGE_LABELS, COMPANION_GENDER_LABELS,
  type CompanionAgeGroup, type CompanionGender, type CompanionPost, type Course,
} from "@/lib/types";
import styles from "./page.module.scss";

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 10;
const GENDERS = Object.keys(COMPANION_GENDER_LABELS) as CompanionGender[];
const AGE_GROUPS = Object.keys(COMPANION_AGE_LABELS) as CompanionAgeGroup[];

interface RecruitForm {
  title: string;
  startDate: string;
  endDate: string;
  deadline: string;
  maxPeople: number;
  gender: CompanionGender;
  ageGroups: CompanionAgeGroup[];
  content: string;
  status: "recruiting" | "completed";
}

// input[type=date] 값(YYYY-MM-DD)을 로컬 날짜 기준으로 계산
function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + days));
}

function defaultForm(course: Course): RecruitForm {
  const today = toDateStr(new Date());
  const start = course.start_date && course.start_date > today ? course.start_date : addDays(today, 7);
  return {
    title: course.title,
    startDate: start,
    endDate: addDays(start, Math.max((course.duration_days ?? 1) - 1, 0)),
    deadline: addDays(start, -1),
    maxPeople: 4,
    gender: "any",
    ageGroups: [],
    content: course.description ?? "",
    status: "recruiting",
  };
}

function formFromPost(post: CompanionPost, course: Course): RecruitForm {
  const base = defaultForm(course);
  return {
    title: post.title,
    startDate: post.start_date ?? base.startDate,
    endDate: post.end_date ?? post.start_date ?? base.endDate,
    deadline: post.recruit_deadline ?? addDays(post.start_date ?? base.startDate, -1),
    maxPeople: post.max_people,
    gender: post.gender,
    ageGroups: post.age_groups,
    content: post.content ?? "",
    status: post.status === "completed" ? "completed" : "recruiting",
  };
}

function validate(form: RecruitForm, isEdit: boolean): string | null {
  const today = toDateStr(new Date());
  if (!form.title.trim()) return "모집글 제목을 입력해 주세요.";
  if (!form.startDate || !form.endDate || !form.deadline) return "여행 일정과 모집 마감일을 입력해 주세요.";
  if (!isEdit && form.startDate <= today) return "출발일은 내일 이후로 선택해 주세요.";
  if (form.endDate < form.startDate) return "여행 종료일은 출발일 이후여야 합니다.";
  if (form.deadline > form.startDate) return "모집 마감일은 출발일 이전이어야 합니다.";
  if (!isEdit && form.deadline < today) return "모집 마감일은 오늘 이후로 선택해 주세요.";
  return null;
}

export default function RecruitSettingsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [course, setCourse] = useState<Course | null>(null);
  const [post, setPost] = useState<CompanionPost | null>(null);
  const [form, setForm] = useState<RecruitForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authStorage.getToken()) { router.push("/login"); return; }
    Promise.all([
      api.get<UserResponse>("/api/auth/me"),
      api.get<Course>(`/api/courses/${courseId}/detail`),
      api.get<CompanionPost[]>(`/api/companion?course_id=${courseId}`),
    ])
      .then(async ([me, c, posts]) => {
        if (c.user_id !== me.id) { setError("본인 코스만 동행을 모집할 수 있습니다."); return; }
        const existing = posts[0] ? await api.get<CompanionPost>(`/api/companion/${posts[0].id}`) : null;
        setCourse(c);
        setPost(existing);
        setForm(existing ? formFromPost(existing, c) : defaultForm(c));
      })
      .catch(() => setError("코스를 불러올 수 없습니다."));
  }, [courseId, router]);

  const isEdit = !!post;
  const update = (patch: Partial<RecruitForm>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const handleStartChange = (startDate: string) => {
    if (!form || !startDate) { update({ startDate }); return; }
    const tripDays = form.startDate && form.endDate
      ? Math.round((Date.parse(form.endDate) - Date.parse(form.startDate)) / 86400000)
      : Math.max((course?.duration_days ?? 1) - 1, 0);
    update({
      startDate,
      endDate: addDays(startDate, Math.max(tripDays, 0)),
      deadline: form.deadline && form.deadline <= startDate ? form.deadline : addDays(startDate, -1),
    });
  };

  const toggleAge = (age: CompanionAgeGroup) => {
    if (!form) return;
    update({
      ageGroups: form.ageGroups.includes(age)
        ? form.ageGroups.filter((a) => a !== age)
        : AGE_GROUPS.filter((a) => a === age || form.ageGroups.includes(a)),
    });
  };

  const handleSubmit = async () => {
    if (!form) return;
    const message = validate(form, isEdit);
    if (message) { alert(message); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim() || null,
      max_people: form.maxPeople,
      start_date: form.startDate,
      end_date: form.endDate,
      recruit_deadline: form.deadline,
      gender: form.gender,
      age_groups: form.ageGroups,
    };
    try {
      if (post) {
        await api.put(`/api/companion/${post.id}`, { ...payload, status: form.status });
      } else {
        await api.post("/api/companion", { course_id: courseId, ...payload });
      }
      router.replace(`/my-courses/${courseId}`);
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
      <span className={styles.headerTitle}>동행 모집 설정</span>
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

  const today = toDateStr(new Date());

  return (
    <div className={styles.page}>
      {header}

      <div className={styles.scroll}>
        <p className={styles.intro}>
          <strong>{course.title}</strong> 코스로 함께 여행할 동행을 모집해요.
        </p>

        <section className={styles.field}>
          <label className={styles.label} htmlFor="recruit-title">모집글 제목</label>
          <input
            id="recruit-title"
            className={styles.input}
            value={form.title}
            maxLength={50}
            onChange={(e) => update({ title: e.target.value })}
          />
        </section>

        <section className={styles.field}>
          <span className={styles.label}>여행 일정</span>
          <div className={styles.dateRow}>
            <label className={styles.dateField}>
              <span className={styles.dateCaption}>출발일</span>
              <input
                type="date"
                className={styles.input}
                value={form.startDate}
                min={isEdit ? undefined : addDays(today, 1)}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </label>
            <label className={styles.dateField}>
              <span className={styles.dateCaption}>종료일</span>
              <input
                type="date"
                className={styles.input}
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => update({ endDate: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className={styles.field}>
          <label className={styles.label} htmlFor="recruit-deadline">모집 마감일</label>
          <input
            id="recruit-deadline"
            type="date"
            className={styles.input}
            value={form.deadline}
            min={isEdit ? undefined : today}
            max={form.startDate}
            onChange={(e) => update({ deadline: e.target.value })}
          />
          <span className={styles.hint}>마감일이 지나면 더 이상 신청을 받지 않아요.</span>
        </section>

        <section className={styles.field}>
          <span className={styles.label}>모집 인원</span>
          <div className={styles.stepperRow}>
            <span className={styles.hint}>나를 포함한 총 인원</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => update({ maxPeople: form.maxPeople - 1 })}
                disabled={form.maxPeople <= MIN_PEOPLE}
                aria-label="인원 줄이기"
              >
                <RiSubtractLine size={18} />
              </button>
              <span className={styles.stepperValue}>{form.maxPeople}명</span>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => update({ maxPeople: form.maxPeople + 1 })}
                disabled={form.maxPeople >= MAX_PEOPLE}
                aria-label="인원 늘리기"
              >
                <RiAddLine size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.field}>
          <span className={styles.label}>성별</span>
          <div className={styles.chips} role="radiogroup" aria-label="성별">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={form.gender === g}
                className={`${styles.chip} ${form.gender === g ? styles.chipSelected : ""}`}
                onClick={() => update({ gender: g })}
              >
                {COMPANION_GENDER_LABELS[g]}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.field}>
          <span className={styles.label}>연령대</span>
          <div className={styles.chips}>
            <button
              type="button"
              aria-pressed={form.ageGroups.length === 0}
              className={`${styles.chip} ${form.ageGroups.length === 0 ? styles.chipSelected : ""}`}
              onClick={() => update({ ageGroups: [] })}
            >
              연령 무관
            </button>
            {AGE_GROUPS.map((age) => (
              <button
                key={age}
                type="button"
                aria-pressed={form.ageGroups.includes(age)}
                className={`${styles.chip} ${form.ageGroups.includes(age) ? styles.chipSelected : ""}`}
                onClick={() => toggleAge(age)}
              >
                {COMPANION_AGE_LABELS[age]}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.field}>
          <label className={styles.label} htmlFor="recruit-content">소개글</label>
          <textarea
            id="recruit-content"
            className={styles.textarea}
            value={form.content}
            maxLength={1000}
            rows={5}
            placeholder="여행 스타일, 비용 분담 방식, 만나는 장소 등을 알려 주세요."
            onChange={(e) => update({ content: e.target.value })}
          />
        </section>

        {isEdit && (
          <section className={styles.field}>
            <span className={styles.label}>모집 상태</span>
            <div className={styles.chips} role="radiogroup" aria-label="모집 상태">
              {(["recruiting", "completed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={form.status === s}
                  className={`${styles.chip} ${form.status === s ? styles.chipSelected : ""}`}
                  onClick={() => update({ status: s })}
                >
                  {s === "recruiting" ? "모집중" : "모집마감"}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className={styles.bottomBar}>
        <button className={styles.btnCancel} onClick={() => router.replace(`/my-courses/${courseId}`)}>
          취소
        </button>
        <button className={styles.btnSubmit} onClick={handleSubmit} disabled={saving}>
          {saving ? "저장 중..." : isEdit ? "저장" : "모집 시작하기"}
        </button>
      </div>
    </div>
  );
}
