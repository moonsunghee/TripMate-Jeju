"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiArrowLeftLine, RiCheckLine,
  RiSunLine, RiCompass3Line, RiAnchorLine, RiRunLine, RiWalkLine,
  RiHeartPulseLine, RiFlag2Line, RiDropLine, RiBikeLine,
  RiUserSmileLine, RiGroupLine,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import JejuMap from "@/components/ui/JejuMap";
import styles from "./page.module.scss";

// ============================================================
// Types
// ============================================================
type TravelPurpose =
  | "휴양" | "등산" | "해양레포츠" | "트레일/러닝" | "제주올레"
  | "웰니스" | "골프" | "낚시" | "자전거" | "가족(어린이)" | "가족(부모님)";

type TransportMethod = "자동차" | "대중교통" | "택시" | "이륜차" | "자전거" | "도보";

type Region =
  | "제주시" | "애월읍" | "한림읍" | "한경면"
  | "조천읍" | "구좌읍" | "추자도" | "비양도"
  | "서귀포시" | "남원읍" | "표선면" | "성산읍"
  | "안덕면" | "대정읍" | "가파도" | "우도" | "한라산";

interface DesignFormData {
  purposes: TravelPurpose[];
  durationDays: number | null;
  startMeal: string;
  endMeal: string;
  transports: TransportMethod[];
  routePreference: string;
  regions: Region[];
  selectedCourseIndex: number | null;
  courseName: string;
  isShared: boolean;
  isRecruiting: boolean;
}

// ============================================================
// Constants
// ============================================================
const PURPOSES: TravelPurpose[] = [
  "휴양", "등산", "해양레포츠", "트레일/러닝", "제주올레",
  "웰니스", "골프", "낚시", "자전거", "가족(어린이)", "가족(부모님)",
];

const PURPOSE_ICONS: Record<TravelPurpose, IconType> = {
  "휴양":       RiSunLine,
  "등산":       RiCompass3Line,
  "해양레포츠": RiAnchorLine,
  "트레일/러닝": RiRunLine,
  "제주올레":   RiWalkLine,
  "웰니스":     RiHeartPulseLine,
  "골프":       RiFlag2Line,
  "낚시":       RiDropLine,
  "자전거":     RiBikeLine,
  "가족(어린이)": RiUserSmileLine,
  "가족(부모님)": RiGroupLine,
};

const TRANSPORTS: TransportMethod[] = ["자동차", "대중교통", "택시", "이륜차", "자전거", "도보"];

const REGIONS: Region[] = [
  "제주시", "애월읍", "한림읍", "한경면",
  "조천읍", "구좌읍", "추자도", "비양도",
  "서귀포시", "남원읍", "표선면", "성산읍",
  "안덕면", "대정읍", "가파도", "우도", "한라산",
];

const MEAL_OPTIONS = ["조식", "오전간식", "중식", "오후간식", "석식", "야식"];
const ROUTE_OPTIONS = ["빠른길 우선", "최단거리 우선", "경치 좋은 길"];

const CATEGORY_COLORS: Record<string, string> = {
  조식: "#E67700", 중식: "#1971C2", 석식: "#C92A2A",
  디저트: "#862E9C", 관광지: "#2D6A4F", 숙소: "#495057", 야식: "#D9480F",
};

const MOCK_COURSES = [
  {
    title: "제주 자연 힐링 코스",
    tags: ["#자연", "#힐링", "#올레길"],
    region: "성산읍 · 제주시",
    duration: "2박 3일",
    summary: "성산일출봉부터 올레길, 협재해수욕장까지 제주 대표 자연 명소를 잇는 코스",
    schedule: [
      { time: "08:00", category: "조식", place: "성산 해녀의 집" },
      { time: "10:00", category: "관광지", place: "성산일출봉" },
      { time: "13:00", category: "중식", place: "성산항 횟집" },
      { time: "15:00", category: "관광지", place: "섭지코지" },
      { time: "18:30", category: "석식", place: "제주 흑돼지 거리" },
      { time: "21:00", category: "숙소", place: "제주시 호텔" },
    ],
  },
  {
    title: "제주 미식 탐방 코스",
    tags: ["#맛집", "#카페", "#흑돼지"],
    region: "제주시 · 서귀포시",
    duration: "2박 3일",
    summary: "제주 명물 음식과 감성 카페를 중심으로 한 미식 여행",
    schedule: [
      { time: "09:00", category: "조식", place: "카페 베케" },
      { time: "11:00", category: "관광지", place: "동문재래시장" },
      { time: "13:00", category: "중식", place: "흑돼지 거리" },
      { time: "15:30", category: "디저트", place: "한라봉 카페" },
      { time: "18:00", category: "석식", place: "서귀포 한치물회" },
      { time: "21:00", category: "숙소", place: "서귀포 펜션" },
    ],
  },
  {
    title: "제주 액티비티 코스",
    tags: ["#서핑", "#액티비티", "#해양스포츠"],
    region: "한림읍 · 애월읍",
    duration: "2박 3일",
    summary: "서핑, 카약, 스노클링 등 다양한 해양 액티비티 중심 코스",
    schedule: [
      { time: "08:30", category: "조식", place: "협재 해변 카페" },
      { time: "10:00", category: "관광지", place: "협재해수욕장 서핑" },
      { time: "13:00", category: "중식", place: "한림 해산물 식당" },
      { time: "15:00", category: "관광지", place: "애월 카약" },
      { time: "18:00", category: "석식", place: "애월 카페거리" },
      { time: "21:00", category: "숙소", place: "애월 리조트" },
    ],
  },
];

const SCREEN_TITLES = [
  "여행목적", "여행일", "교통수단", "여행희망지역",
  "AI코스 설계 중", "코스 선택", "코스 확인", "코스 저장",
];

const INITIAL_FORM: DesignFormData = {
  purposes: [], durationDays: null, startMeal: "조식", endMeal: "석식",
  transports: [], routePreference: "빠른길 우선", regions: [],
  selectedCourseIndex: null, courseName: "", isShared: false, isRecruiting: false,
};

// ============================================================
// Shared prop type
// ============================================================
type StepProps = {
  form: DesignFormData;
  setForm: React.Dispatch<React.SetStateAction<DesignFormData>>;
};

// ============================================================
// Main Page
// ============================================================
export default function DesignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DesignFormData>(INITIAL_FORM);

  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => setStep(6), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const handleNext = () => setStep((s) => s + 1);

  const canNext = (): boolean => {
    if (step === 1) return form.purposes.length > 0;
    if (step === 2) return form.durationDays !== null;
    if (step === 3) return form.transports.length > 0;
    if (step === 4) return form.regions.length > 0;
    if (step === 6) return form.selectedCourseIndex !== null;
    return true;
  };

  const handleSave = (isDraft: boolean) => {
    alert(isDraft ? "임시저장 되었습니다." : "코스가 저장되었습니다.");
    router.push("/my-courses");
  };

  const isLoading = step === 5;
  const isSave = step === 8;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <RiArrowLeftLine size={20} />
        </button>
        <span className={styles.headerTitle}>{SCREEN_TITLES[step - 1]}</span>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.content}>
        {step === 1 && <PurposeStep form={form} setForm={setForm} />}
        {step === 2 && <DurationStep form={form} setForm={setForm} />}
        {step === 3 && <TransportStep form={form} setForm={setForm} />}
        {step === 4 && <RegionStep form={form} setForm={setForm} />}
        {step === 5 && <LoadingStep />}
        {step === 6 && <CourseSelectStep form={form} setForm={setForm} />}
        {step === 7 && <CourseDetailStep form={form} />}
        {step === 8 && <SaveStep form={form} setForm={setForm} onSave={handleSave} />}
      </div>

      {!isLoading && (
        <div className={styles.bottomBar}>
          {isSave ? (
            <>
              <button className={styles.btnPrev} onClick={handleBack}>이전</button>
              <button className={styles.btnDraft} onClick={() => handleSave(true)}>임시저장</button>
              <button className={styles.btnNext} onClick={() => handleSave(false)}>저장</button>
            </>
          ) : (
            <>
              <button className={styles.btnPrev} onClick={handleBack}>
                {step === 1 ? "취소" : "이전"}
              </button>
              <button className={styles.btnNext} onClick={handleNext} disabled={!canNext()}>
                다음
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// StepHeader (STEP N 레이블 + 타이틀 + 서브타이틀)
// ============================================================
function StepHeader({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className={styles.stepHeader}>
      <span className={styles.stepLabel}>STEP {step}</span>
      <h2 className={styles.stepTitle}>{title}</h2>
      <p className={styles.stepSubtitle}>{desc}</p>
    </div>
  );
}

// ============================================================
// Step 1: 여행 목적
// ============================================================
function PurposeStep({ form, setForm }: StepProps) {
  const toggle = (p: TravelPurpose) =>
    setForm((prev) => ({
      ...prev,
      purposes: prev.purposes.includes(p)
        ? prev.purposes.filter((x) => x !== p)
        : [...prev.purposes, p],
    }));

  return (
    <div className={styles.stepContent}>
      <div className={styles.card}>
        <StepHeader step={1} title="여행목적" desc="여행 목적을 선택해 주세요. (복수선택가능)" />
        <div className={styles.purposeList}>
          {PURPOSES.map((p) => {
            const Icon = PURPOSE_ICONS[p];
            const selected = form.purposes.includes(p);
            return (
              <button
                key={p}
                className={`${styles.purposeBtn} ${selected ? styles.purposeBtnSelected : ""}`}
                onClick={() => toggle(p)}
              >
                <span className={styles.purposeIconWrap}>
                  <Icon size={18} />
                </span>
                <span>{p}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 2: 여행일수 + 시작/종료일정
// ============================================================
function DurationStep({ form, setForm }: StepProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.card}>
        <StepHeader step={2} title="여행일수" desc="여행일수를 선택해 주세요. (최대 6박 7일)" />
        <div className={styles.dayRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              className={`${styles.dayBtn} ${form.durationDays === n ? styles.dayBtnSelected : ""}`}
              onClick={() => setForm((p) => ({ ...p, durationDays: n }))}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <StepHeader step={3} title="시작, 종료일정" desc="시작과 종료 일정을 선택해 주세요." />
        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>첫째 날 시작일정</label>
          <select
            className={styles.selectBox}
            value={form.startMeal}
            onChange={(e) => setForm((p) => ({ ...p, startMeal: e.target.value }))}
          >
            {MEAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>마지막 날 종료일정</label>
          <select
            className={styles.selectBox}
            value={form.endMeal}
            onChange={(e) => setForm((p) => ({ ...p, endMeal: e.target.value }))}
          >
            {MEAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 3: 교통수단 + 선호경로
// ============================================================
function TransportStep({ form, setForm }: StepProps) {
  const toggle = (t: TransportMethod) =>
    setForm((prev) => ({
      ...prev,
      transports: prev.transports.includes(t)
        ? prev.transports.filter((x) => x !== t)
        : [...prev.transports, t],
    }));

  return (
    <div className={styles.stepContent}>
      <div className={styles.card}>
        <StepHeader step={4} title="교통수단" desc="교통수단을 선택해 주세요." />
        <div className={styles.transportGrid}>
          {TRANSPORTS.map((t) => (
            <button
              key={t}
              className={`${styles.gridBtn} ${form.transports.includes(t) ? styles.gridBtnSelected : ""}`}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <StepHeader step={5} title="선호 경로" desc="선호하는 경로를 선택해 주세요." />
        <select
          className={styles.selectBox}
          value={form.routePreference}
          onChange={(e) => setForm((p) => ({ ...p, routePreference: e.target.value }))}
        >
          {ROUTE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: 여행 지역
// ============================================================
function RegionStep({ form, setForm }: StepProps) {
  const toggle = (r: Region) =>
    setForm((prev) => ({
      ...prev,
      regions: prev.regions.includes(r)
        ? prev.regions.filter((x) => x !== r)
        : [...prev.regions, r],
    }));

  return (
    <div className={styles.stepContent}>
      <div className={styles.card}>
        <StepHeader step={6} title="여행지역" desc="여행 희망 지역을 선택해 주세요. (복수선택가능)" />
        <JejuMap
          selectedRegions={form.regions}
          onToggleRegion={(r) => toggle(r as Region)}
        />
        <div className={styles.regionGrid}>
          {REGIONS.map((r) => (
            <button
              key={r}
              className={`${styles.gridBtn} ${form.regions.includes(r) ? styles.gridBtnSelected : ""}`}
              onClick={() => toggle(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 5: AI 로딩
// ============================================================
function LoadingStep() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingOrb} />
      <p className={styles.loadingText}>AI가 코스 설계 중</p>
      <div className={styles.loadingDots}>
        <span /><span /><span />
      </div>
    </div>
  );
}

// ============================================================
// Step 6: 코스 선택
// ============================================================
function CourseSelectStep({ form, setForm }: StepProps) {
  return (
    <div className={styles.stepContent}>
      <p className={styles.courseDesc}>마음에 드는 코스를 선택하세요</p>
      <div className={styles.courseList}>
        {MOCK_COURSES.map((course, index) => (
          <button
            key={index}
            className={`${styles.courseCard} ${form.selectedCourseIndex === index ? styles.courseCardSelected : ""}`}
            onClick={() => setForm((p) => ({ ...p, selectedCourseIndex: index }))}
          >
            <div className={styles.courseCardHeader}>
              <span className={styles.courseCardNum}>코스 {index + 1}</span>
              {form.selectedCourseIndex === index && <RiCheckLine size={18} />}
            </div>
            <h3 className={styles.courseCardTitle}>{course.title}</h3>
            <p className={styles.courseCardDesc}>{course.summary}</p>
            <div className={styles.courseCardMeta}>
              <span>{course.region}</span>
              <span>{course.duration}</span>
            </div>
            <div className={styles.tagRow}>
              {course.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Step 7: 코스 상세 확인
// ============================================================
function CourseDetailStep({ form }: { form: DesignFormData }) {
  const course = form.selectedCourseIndex !== null ? MOCK_COURSES[form.selectedCourseIndex] : null;
  if (!course) return null;

  return (
    <div className={styles.detailWrap}>
      <div className={styles.detailMapPlaceholder}>
        <span className={styles.detailMapIcon}>🗺️</span>
        <p>제주 지도</p>
      </div>
      <div className={styles.detailBody}>
        <div className={styles.tagRow}>
          {course.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
        </div>
        <h2 className={styles.detailTitle}>{course.title}</h2>
        <p className={styles.detailDesc}>{course.summary}</p>

        <div>
          <h3 className={styles.scheduleSectionTitle}>1일차 일정</h3>
          <div className={styles.scheduleList}>
            {course.schedule.map((item, i) => (
              <div key={i} className={styles.scheduleItem}>
                <span className={styles.scheduleTime}>{item.time}</span>
                <div className={styles.scheduleConnector}>
                  <div
                    className={styles.scheduleDot}
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] ?? "#495057" }}
                  />
                  {i < course.schedule.length - 1 && <div className={styles.scheduleLine} />}
                </div>
                <div className={styles.scheduleContent}>
                  <span
                    className={styles.scheduleCategory}
                    style={{ color: CATEGORY_COLORS[item.category] ?? "#495057" }}
                  >
                    {item.category}
                  </span>
                  <span className={styles.schedulePlace}>{item.place}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 8: 저장 설정
// ============================================================
function SaveStep({
  form, setForm, onSave,
}: StepProps & { onSave: (isDraft: boolean) => void }) {
  const course = form.selectedCourseIndex !== null ? MOCK_COURSES[form.selectedCourseIndex] : null;

  return (
    <div className={styles.saveContent}>
      <p className={styles.saveDesc}>코스를 저장하기 전 설정을 확인하세요</p>

      <div className={styles.saveField}>
        <label className={styles.saveLabel}>코스 이름</label>
        <input
          type="text"
          className={styles.saveInput}
          placeholder={course?.title ?? "코스 이름을 입력하세요"}
          value={form.courseName}
          onChange={(e) => setForm((p) => ({ ...p, courseName: e.target.value }))}
        />
      </div>

      <div className={styles.toggleField}>
        <div className={styles.toggleInfo}>
          <span className={styles.toggleLabel}>커뮤니티 공유</span>
          <span className={styles.toggleHint}>다른 사람들이 내 코스를 볼 수 있어요</span>
        </div>
        <button
          className={`${styles.toggle} ${form.isShared ? styles.toggleOn : ""}`}
          onClick={() => setForm((p) => ({ ...p, isShared: !p.isShared }))}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      <div className={styles.toggleField}>
        <div className={styles.toggleInfo}>
          <span className={styles.toggleLabel}>동행 모집</span>
          <span className={styles.toggleHint}>함께 여행할 동행을 모집해요</span>
        </div>
        <button
          className={`${styles.toggle} ${form.isRecruiting ? styles.toggleOn : ""}`}
          onClick={() => setForm((p) => ({ ...p, isRecruiting: !p.isRecruiting }))}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>
    </div>
  );
}
