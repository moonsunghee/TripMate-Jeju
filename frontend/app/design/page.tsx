"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { GeneratedCourse, Course } from "@/lib/types";
import {
  RiArrowLeftLine, RiCheckLine,
  RiSunLine, RiCompass3Line, RiAnchorLine, RiRunLine, RiWalkLine,
  RiHeartPulseLine, RiFlag2Line, RiDropLine, RiBikeLine,
  RiUserSmileLine, RiGroupLine,
  RiRestaurantLine, RiCupLine, RiMapPin2Line, RiHome2Line,
  RiCarLine, RiHeartLine, RiRouteLine, RiCalendarLine, RiTimeLine,
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

const CATEGORY_ICONS: Record<string, IconType> = {
  조식: RiRestaurantLine,
  중식: RiRestaurantLine,
  석식: RiRestaurantLine,
  야식: RiRestaurantLine,
  디저트: RiCupLine,
  관광지: RiMapPin2Line,
  숙소: RiHome2Line,
};

const MOCK_COURSES = [
  {
    title: "제주 자연 힐링 코스",
    tags: ["자연", "힐링", "올레길", "맛집", "트레킹"],
    region: "성산읍 · 제주시",
    distance: "28km",
    duration: "2박 3일",
    likes: 54,
    summary: "성산일출봉부터 올레길, 협재해수욕장까지 제주 대표 자연 명소를 잇는 코스",
    days: [
      { items: [
        { category: "조식", place: "성산 해녀의 집", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 78" },
        { category: "관광지", place: "성산일출봉", duration: "2시간", address: "제주 서귀포시 성산읍 일출로 284-12" },
        { category: "중식", place: "성산항 횟집", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 224" },
        { category: "관광지", place: "섭지코지", duration: "2시간", address: "제주 서귀포시 성산읍 고성리 127-1" },
        { category: "석식", place: "제주 흑돼지 거리", duration: "1.5시간", address: "제주 제주시 연동 291-15" },
        { category: "숙소", place: "제주시 호텔", duration: "12시간", address: "제주 제주시 연동 312-1" },
      ], transports: ["45min", "20min", "30min", "45min", "10min"] },
      { items: [
        { category: "조식", place: "제주시 카페", duration: "1시간", address: "제주 제주시 연동 315-3" },
        { category: "관광지", place: "한라산 등반", duration: "5시간", address: "제주 제주시 아라동 산220" },
        { category: "중식", place: "어리목 산장", duration: "1시간", address: "제주 제주시 해안동 산220-1" },
        { category: "관광지", place: "천지연폭포", duration: "1.5시간", address: "제주 서귀포시 천지동 667-7" },
        { category: "석식", place: "서귀포 올레시장", duration: "1시간", address: "제주 서귀포시 중앙로 62번길 18" },
        { category: "숙소", place: "서귀포 호텔", duration: "12시간", address: "제주 서귀포시 중앙로 85" },
      ], transports: ["1시간", "30min", "50min", "30min", "15min"] },
      { items: [
        { category: "조식", place: "서귀포 베이커리", duration: "1시간", address: "제주 서귀포시 중앙로 71" },
        { category: "관광지", place: "협재해수욕장", duration: "2시간", address: "제주 제주시 한림읍 협재리 2497-1" },
        { category: "중식", place: "한림 해산물 식당", duration: "1시간", address: "제주 제주시 한림읍 한림로 300" },
        { category: "관광지", place: "곽지해수욕장", duration: "1.5시간", address: "제주 제주시 애월읍 곽지리 1566" },
        { category: "석식", place: "애월 카페거리", duration: "1.5시간", address: "제주 제주시 애월읍 애월리 2519" },
      ], transports: ["50min", "20min", "25min", "30min"] },
    ],
  },
  {
    title: "제주 미식 탐방 코스",
    tags: ["맛집", "카페", "흑돼지", "미식", "투어"],
    region: "제주시 · 서귀포시",
    distance: "22km",
    duration: "2박 3일",
    likes: 89,
    summary: "제주 명물 음식과 감성 카페를 중심으로 한 미식 여행",
    days: [
      { items: [
        { category: "조식", place: "카페 베케", duration: "1시간", address: "제주 제주시 구남로2길 32 1층" },
        { category: "관광지", place: "동문재래시장", duration: "2시간", address: "제주 제주시 관덕로14길 20" },
        { category: "중식", place: "흑돼지 거리", duration: "1.5시간", address: "제주 제주시 도두일동 1892-4" },
        { category: "디저트", place: "한라봉 카페", duration: "1시간", address: "제주 제주시 연동 261-30" },
        { category: "석식", place: "서귀포 한치물회", duration: "1.5시간", address: "제주 서귀포시 서문로 28" },
        { category: "숙소", place: "서귀포 펜션", duration: "12시간", address: "제주 서귀포시 칠십리로 156" },
      ], transports: ["20min", "15min", "25min", "35min", "10min"] },
      { items: [
        { category: "조식", place: "성산 해변 카페", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 14" },
        { category: "관광지", place: "성산일출봉", duration: "2시간", address: "제주 서귀포시 성산읍 일출로 284-12" },
        { category: "중식", place: "해녀 음식점", duration: "1시간", address: "제주 서귀포시 성산읍 성산리 78" },
        { category: "디저트", place: "우도 땅콩 아이스크림", duration: "1시간", address: "제주 제주시 우도면 우도해안길 40" },
        { category: "석식", place: "제주시 갈치조림", duration: "1.5시간", address: "제주 제주시 서광로 51" },
        { category: "숙소", place: "제주시 호텔", duration: "12시간", address: "제주 제주시 연동 312-1" },
      ], transports: ["1시간", "10min", "1시간 30min", "45min", "20min"] },
      { items: [
        { category: "조식", place: "제주 베이글 카페", duration: "1시간", address: "제주 제주시 이도2동 245-3" },
        { category: "관광지", place: "동문시장 투어", duration: "1.5시간", address: "제주 제주시 관덕로14길 20" },
        { category: "중식", place: "제주 순대국밥", duration: "1시간", address: "제주 제주시 중앙로 54" },
        { category: "디저트", place: "제주 오름 카페", duration: "1시간", address: "제주 제주시 조천읍 선흘리 2905" },
        { category: "석식", place: "공항 근처 흑돼지", duration: "1.5시간", address: "제주 제주시 용담2동 2677" },
      ], transports: ["15min", "10min", "30min", "25min"] },
    ],
  },
  {
    title: "제주 액티비티 코스",
    tags: ["서핑", "액티비티", "해양스포츠", "카약", "스노클링"],
    region: "한림읍 · 애월읍",
    distance: "35km",
    duration: "2박 3일",
    likes: 67,
    summary: "서핑, 카약, 스노클링 등 다양한 해양 액티비티 중심 코스",
    days: [
      { items: [
        { category: "조식", place: "협재 해변 카페", duration: "1시간", address: "제주 제주시 한림읍 협재리 2500" },
        { category: "관광지", place: "협재해수욕장 서핑", duration: "3시간", address: "제주 제주시 한림읍 협재리 2497-1" },
        { category: "중식", place: "한림 해산물 식당", duration: "1시간", address: "제주 제주시 한림읍 한림로 300" },
        { category: "관광지", place: "애월 카약", duration: "2시간", address: "제주 제주시 애월읍 애월리 2519" },
        { category: "석식", place: "애월 카페거리", duration: "1.5시간", address: "제주 제주시 애월읍 애월리 2520" },
        { category: "숙소", place: "애월 리조트", duration: "12시간", address: "제주 제주시 애월읍 하귀1리 1764" },
      ], transports: ["10min", "20min", "30min", "20min", "15min"] },
      { items: [
        { category: "조식", place: "애월 서핑 카페", duration: "1시간", address: "제주 제주시 애월읍 애월리 2521" },
        { category: "관광지", place: "금능해수욕장 스노클링", duration: "3시간", address: "제주 제주시 한림읍 금능리 119-10" },
        { category: "중식", place: "한림항 회센터", duration: "1.5시간", address: "제주 제주시 한림읍 한림로 269" },
        { category: "관광지", place: "비양도 트레킹", duration: "3시간", address: "제주 제주시 한림읍 비양리 1" },
        { category: "석식", place: "한림 현지 맛집", duration: "1시간", address: "제주 제주시 한림읍 한림로 290" },
        { category: "숙소", place: "협재 게스트하우스", duration: "12시간", address: "제주 제주시 한림읍 협재리 2498" },
      ], transports: ["20min", "15min", "30min", "15min", "10min"] },
      { items: [
        { category: "조식", place: "협재 조식 카페", duration: "1시간", address: "제주 제주시 한림읍 협재리 2501" },
        { category: "관광지", place: "곽지해수욕장", duration: "2시간", address: "제주 제주시 애월읍 곽지리 1566" },
        { category: "중식", place: "애월 해산물 뷔페", duration: "1.5시간", address: "제주 제주시 애월읍 애월리 1422" },
        { category: "관광지", place: "이호테우해변", duration: "1.5시간", address: "제주 제주시 이호동 1665" },
        { category: "석식", place: "공항 근처 식당", duration: "1시간", address: "제주 제주시 용담2동 2677" },
      ], transports: ["25min", "20min", "30min", "20min"] },
    ],
  },
];

const SCREEN_TITLES = [
  "여행목적", "여행일", "교통수단", "여행희망지역",
  "AI코스 설계 중", "코스 선택", "추천코스상세", "코스 저장",
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
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [saving, setSaving] = useState(false);
  const generateCalled = useRef(false);

  // step 5: AI 생성 호출
  useEffect(() => {
    if (step !== 5) return;
    if (generateCalled.current) return;
    generateCalled.current = true;

    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.setDate(today.getDate() + (form.durationDays ?? 1) - 1))
      .toISOString().slice(0, 10);

    api.post<GeneratedCourse>("/api/courses/generate", {
      travel_style: form.purposes[0] ?? "휴양",
      start_date: start,
      end_date: end,
      region: form.regions[0] ?? "제주시",
      meal_count: 3,
      tourist_count: 2,
      transport: form.transports[0] ?? "렌터카",
    }).then((data) => {
      setGeneratedCourse(data);
      setStep(6);
    }).catch(() => {
      // API 실패 시에도 step 6으로 이동 (mock 사용)
      setStep(6);
    });
  }, [step, form]);

  const handleBack = () => {
    if (step === 1) router.back();
    else {
      if (step === 6) generateCalled.current = false; // 재생성 허용
      setStep((s) => s - 1);
    }
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

  const handleSave = async (isDraft: boolean) => {
    setSaving(true);
    try {
      // 선택된 코스 데이터 구성
      const selected = form.selectedCourseIndex !== null ? MOCK_COURSES[form.selectedCourseIndex] : null;
      const aiPlaces = generatedCourse?.places ?? [];

      // AI 생성 코스가 있고 index 0이면 AI 데이터 사용, 아니면 mock
      const usedPlaces = (form.selectedCourseIndex === 0 && aiPlaces.length > 0)
        ? aiPlaces.map((p) => ({
            place_name: p.place_name,
            category: p.category,
            day: p.day,
            visit_order: p.visit_order,
            time: p.time,
            memo: p.memo,
          }))
        : (selected?.days ?? []).flatMap((day, di) =>
            day.items.map((item, ii) => ({
              place_name: item.place,
              category: item.category,
              day: di + 1,
              visit_order: ii + 1,
              time: null,
              memo: item.address,
            }))
          );

      const title = form.courseName.trim() || generatedCourse?.title || selected?.title || "제주 여행 코스";
      const today = new Date();
      const start = today.toISOString().slice(0, 10);

      const savedCourse = await api.post<Course>("/api/courses", {
        title,
        description: generatedCourse?.description ?? selected?.summary ?? null,
        duration_days: form.durationDays,
        travel_style: form.purposes[0] ?? null,
        region: form.regions[0] ?? null,
        transport: form.transports[0] ?? null,
        is_shared: form.isShared,
        is_recruiting: form.isRecruiting,
        status: isDraft ? "draft" : (form.isRecruiting ? "recruiting" : form.isShared ? "sharing" : "master"),
        start_date: start,
        places: usedPlaces,
      });

      // 동행 모집 설정 시 companion post 자동 생성
      if (!isDraft && form.isRecruiting && savedCourse) {
        await api.post("/api/companion", {
          course_id: savedCourse.id,
          title,
          content: generatedCourse?.description ?? null,
          max_people: 4,
          start_date: start,
        }).catch(() => {});
      }

      alert(isDraft ? "임시저장 되었습니다." : "코스가 저장되었습니다.");
      router.push("/my-courses");
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
      else alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
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
        {step === 6 && <CourseSelectStep form={form} setForm={setForm} generatedCourse={generatedCourse} />}
        {step === 7 && <CourseDetailStep form={form} generatedCourse={generatedCourse} />}
        {step === 8 && <SaveStep form={form} setForm={setForm} onSave={handleSave} saving={saving} />}
      </div>

      {!isLoading && (
        <div className={styles.bottomBar}>
          {isSave ? (
            <>
              <button className={styles.btnPrev} onClick={handleBack} disabled={saving}>이전</button>
              <button className={styles.btnDraft} onClick={() => handleSave(true)} disabled={saving}>임시저장</button>
              <button className={styles.btnNext} onClick={() => handleSave(false)} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : step === 7 ? (
            <>
              <button className={styles.btnPrev} onClick={handleBack}>취소</button>
              <button className={styles.btnNext} onClick={handleNext}>코스 선택</button>
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
                <Icon size={22} className={styles.purposeIcon} />
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
function CourseSelectStep({ form, setForm, generatedCourse }: StepProps & { generatedCourse: GeneratedCourse | null }) {
  // AI 생성 코스를 index 0 카드로 표시, 나머지 2개는 mock
  const displayCourses = MOCK_COURSES.map((c, i) => {
    if (i === 0 && generatedCourse) {
      return {
        title: generatedCourse.title,
        summary: generatedCourse.description,
        tags: ["AI 생성"],
        region: "-",
        duration: `${generatedCourse.places.filter((p, pi, arr) => arr.findIndex((x) => x.day === p.day) === pi).length}일`,
      };
    }
    return { title: c.title, summary: c.summary, tags: c.tags, region: c.region, duration: c.duration };
  });

  return (
    <div className={styles.stepContent}>
      <p className={styles.courseDesc}>마음에 드는 코스를 선택하세요</p>
      <div className={styles.courseList}>
        {displayCourses.map((course, index) => (
          <button
            key={index}
            className={`${styles.courseCard} ${form.selectedCourseIndex === index ? styles.courseCardSelected : ""}`}
            onClick={() => setForm((p) => ({ ...p, selectedCourseIndex: index }))}
          >
            <div className={styles.courseCardHeader}>
              <span className={styles.courseCardNum}>코스 {index + 1}</span>
              {index === 0 && generatedCourse && <span style={{ fontSize: "11px", color: "#52B788" }}>AI 생성</span>}
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
function CourseDetailStep({ form, generatedCourse }: { form: DesignFormData; generatedCourse: GeneratedCourse | null }) {
  const [activeDay, setActiveDay] = useState(1);

  // index 0 + AI 생성 코스가 있으면 AI 데이터 사용
  const useAI = form.selectedCourseIndex === 0 && generatedCourse;

  const course = !useAI && form.selectedCourseIndex !== null ? MOCK_COURSES[form.selectedCourseIndex] : null;

  // AI 코스를 mock 형태로 변환
  const aiDays = useAI ? (() => {
    const map = new Map<number, typeof generatedCourse.places>();
    for (const p of generatedCourse.places) {
      if (!map.has(p.day)) map.set(p.day, []);
      map.get(p.day)!.push(p);
    }
    return Array.from(map.keys()).sort((a, b) => a - b).map((d) =>
      map.get(d)!.sort((a, b) => a.visit_order - b.visit_order).map((p) => ({
        category: p.category,
        place: p.place_name,
        duration: p.time ?? "-",
        address: p.memo ?? "",
      }))
    );
  })() : null;

  const title = useAI ? generatedCourse.title : course?.title ?? "";
  const tags = useAI ? ["AI 생성"] : (course?.tags ?? []);
  const days = useAI ? aiDays! : (course?.days.map((d) => d.items) ?? []);
  const allTransports = course?.days.map((d) => d.transports) ?? [];

  if (!useAI && !course) return null;

  const currentDay = days[activeDay - 1] ?? [];
  const items = currentDay;
  const transports = allTransports[activeDay - 1] ?? [];

  return (
    <div className={styles.detailWrap}>
      {/* Title + Tags */}
      <div className={styles.detailTitleSection}>
        <h2 className={styles.detailTitle}>{title}</h2>
        <div className={styles.detailTagScroll}>
          {tags.map((tag) => (
            <span key={tag} className={styles.detailTag}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <div className={styles.detailMap}>
        <RiMapPin2Line size={28} className={styles.detailMapIcon} />
        <p className={styles.detailMapText}>지도</p>
      </div>

      {/* Stats */}
      <div className={styles.detailStats}>
        <div className={styles.detailStatItem}>
          <RiRouteLine size={16} />
          <span>{useAI ? (form.regions[0] ?? "-") : (course?.distance ?? "-")}</span>
        </div>
        <div className={styles.detailStatDivider} />
        <div className={styles.detailStatItem}>
          <RiCalendarLine size={16} />
          <span>{useAI ? `${days.length}일` : (course?.duration ?? "-")}</span>
        </div>
        <div className={styles.detailStatDivider} />
        <div className={styles.detailStatItem}>
          <RiHeartLine size={16} />
          <span>{useAI ? "AI" : (course?.likes ?? 0)}</span>
        </div>
      </div>

      {/* Day tabs */}
      <div className={styles.dayTabsSection}>
        <div className={styles.dayTabs}>
          {days.map((_, i) => {
            const day = i + 1;
            return (
              <button
                key={day}
                className={`${styles.dayTab} ${activeDay === day ? styles.dayTabActive : ""}`}
                onClick={() => setActiveDay(day)}
              >
                {day}일
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div className={styles.scheduleSection}>
        {items.map((item, i) => {
          const Icon = CATEGORY_ICONS[item.category];
          return (
            <div key={i} className={styles.scheduleRow}>
              {/* Left: number + connector line */}
              <div className={styles.scheduleLeft}>
                <div className={styles.scheduleNum}>{i + 1}</div>
                {i < items.length - 1 && <div className={styles.scheduleConn} />}
              </div>

              {/* Right: card + transport */}
              <div className={styles.scheduleRight}>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleCardTop}>
                    <div className={styles.scheduleCardCategory}>
                      {Icon && <Icon size={17} />}
                      <span>{item.category}</span>
                    </div>
                    <div className={styles.scheduleCardDuration}>
                      <RiTimeLine size={13} />
                      <span>{item.duration}</span>
                    </div>
                  </div>
                  <div className={styles.scheduleCardAddrRow}>
                    <span className={styles.scheduleCardAddr}>{item.place}</span>
                    <button
                      className={styles.copyBtn}
                      onClick={() => navigator.clipboard?.writeText(item.place)}
                    >복사</button>
                  </div>
                  <div className={styles.scheduleCardAddrRow}>
                    <span className={styles.scheduleCardAddr}>{item.address}</span>
                    <button
                      className={styles.copyBtn}
                      onClick={() => navigator.clipboard?.writeText(item.address)}
                    >복사</button>
                  </div>
                  <div className={styles.scheduleCardActions}>
                    <button className={styles.deleteBtn}>삭제</button>
                    <button className={styles.editBtn}>수정</button>
                  </div>
                </div>
                {i < items.length - 1 && (
                  <div className={styles.transportRow}>
                    <RiCarLine size={15} />
                    <span>{transports[i]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Step 8: 저장 설정
// ============================================================
function SaveStep({
  form, setForm, onSave, saving,
}: StepProps & { onSave: (isDraft: boolean) => void; saving: boolean }) {
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
