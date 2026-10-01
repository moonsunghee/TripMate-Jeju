"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiRouteLine, RiCalendarLine, RiHeartLine, RiCarLine, RiGroupLine,
  RiEditLine, RiShareLine, RiDeleteBinLine,
} from "react-icons/ri";
import { api, ApiError } from "@/lib/api";
import type { Course, CoursePlace, Place } from "@/lib/types";
import KakaoMap from "@/components/KakaoMap";
import PlaceDetailSheet, { type PlaceDetailData } from "@/components/ui/PlaceDetailSheet";
import PlaceEditSheet from "@/components/ui/PlaceEditSheet";
import ShareSheet from "@/components/ShareSheet";
import ScheduleCard, { PLACE_OPTIONS } from "@/components/ScheduleCard";
import styles from "./page.module.scss";

const STATUS_LABEL: Record<string, string> = {
  master: "나만보기", sharing: "공유코스",
  recruiting: "모집중", completed: "모집마감", discarded: "폐기됨",
};

function groupByDay(places: CoursePlace[]): CoursePlace[][] {
  const map = new Map<number, CoursePlace[]>();
  for (const p of places) {
    if (!map.has(p.day)) map.set(p.day, []);
    map.get(p.day)!.push(p);
  }
  return Array.from(map.keys())
    .sort((a, b) => a - b)
    .map((d) => map.get(d)!.sort((a, b) => a.visit_order - b.visit_order));
}

export default function MyCourseDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailData | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [shareOpen, setShareOpen] = useState(false);

  const openPlaceDetail = (item: CoursePlace) => {
    setSelectedPlaceId(item.id);
    setSheetMode("view");
    setSelectedPlace({
      category: item.category,
      time: item.time,
      placeName: item.place_name ?? "-",
      memo: item.memo,
      address: item.road_address ?? item.address,
      image: item.place_image,
      options: PLACE_OPTIONS.map((o) => o.label),
    });
    if (item.place_id) {
      api.get<Place>(`/api/places/${item.place_id}`)
        .then((place) => setSelectedPlace((prev) => prev && ({
          ...prev,
          address: place.address,
          phone: place.phone_number,
          description: place.description,
          image: prev.image ?? place.place_image,
        })))
        .catch(() => {});
    }
  };

  const closeSheets = () => {
    setSelectedPlace(null);
    setSelectedPlaceId(null);
    setSheetMode("view");
  };

  const toPlacePayload = (p: CoursePlace) => ({
    place_id: p.place_id,
    visit_order: p.visit_order,
    day: p.day,
    place_name: p.place_name,
    category: p.category,
    time: p.time,
    stay_minutes: p.stay_minutes,
    address: p.address,
    road_address: p.road_address,
    memo: p.memo,
  });

  const handleDeletePlace = async () => {
    if (!course || selectedPlaceId == null) return;
    const places = course.course_places
      .filter((p) => p.id !== selectedPlaceId)
      .map(toPlacePayload);
    const updated = await api.put<Course>(`/api/courses/${course.id}`, { places });
    setCourse(updated);
    closeSheets();
  };

  const handleSelectPlace = async (place: Place) => {
    if (!course || selectedPlaceId == null) return;
    const places = course.course_places.map((p) =>
      p.id === selectedPlaceId
        ? {
            ...toPlacePayload(p),
            place_id: place.id,
            place_name: place.place_name,
            category: place.category,
            address: place.address,
            road_address: place.road_address,
          }
        : toPlacePayload(p)
    );
    const updated = await api.put<Course>(`/api/courses/${course.id}`, { places });
    setCourse(updated);
    closeSheets();
  };

  useEffect(() => {
    api.get<Course>(`/api/courses/${id}/detail`)
      .then(setCourse)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>내 코스 상세</span>
          <span />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>로딩 중...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}><RiArrowLeftLine size={22} /></button>
          <span className={styles.headerTitle}>오류</span>
          <span />
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "#868e96" }}>코스를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const isEditable = !course.is_shared && !course.is_recruiting;
  const canStartRecruit = course.is_shared && !course.is_recruiting;

  const handleDelete = async () => {
    const warning = course.is_recruiting ? "\n동행 모집글과 신청 내역, 채팅방도 함께 삭제돼요." : "";
    if (!confirm(`코스 "${course.title}"을 삭제할까요?${warning}`)) return;
    try {
      await api.delete(`/api/courses/${course.id}`);
      router.replace("/my-courses");
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
  };

  const badgeStatus = course.status === "completed" ? "completed" : course.is_recruiting ? "recruiting" : course.is_shared ? "sharing" : course.status;
  const tags = course.travel_style ? [course.travel_style] : [];
  const days = groupByDay(course.course_places);
  const currentDay = days[activeDay - 1] ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>내 코스 상세</span>
        <span className={`${styles.headerBadge} ${styles[`badge_${badgeStatus}`]}`}>
          {STATUS_LABEL[badgeStatus] ?? badgeStatus}
        </span>
      </div>

      <div className={styles.scroll}>
        {/* Title + Tags */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{course.title}</h1>
          <div className={styles.tagScroll}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Map */}
        <KakaoMap
          places={currentDay.map((p) => p.place_name ?? "")}
          className={styles.map}
        />

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <RiRouteLine size={16} />
            <span>{course.region ?? "-"}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiCalendarLine size={16} />
            <span>{course.duration_days ? `${course.duration_days}일` : "-"}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <RiHeartLine size={16} />
            <span>{course.like_count}</span>
          </div>
        </div>

        {/* 모집 현황 (is_recruiting 전용) */}
        {course.is_recruiting && (
          <div className={styles.recruitStrip}>
            <div className={styles.recruitLeft}>
              <RiGroupLine size={14} className={styles.recruitIcon} />
              <span className={styles.recruitText}>
                {course.status === "completed" ? "동행 모집마감" : "동행 모집중"}
              </span>
            </div>
          </div>
        )}

        {/* Day tabs */}
        {days.length > 0 && (
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
        )}

        {/* Schedule */}
        <div className={styles.scheduleSection}>
          {currentDay.length === 0 && (
            <p style={{ color: "#868e96", textAlign: "center", padding: "1rem" }}>일정이 없습니다</p>
          )}
          {currentDay.map((item, i) => {
            return (
              <div key={item.id} className={styles.scheduleRow}>
                <div className={styles.scheduleLeft}>
                  <div className={styles.scheduleNum}>{i + 1}</div>
                  {i < currentDay.length - 1 && <div className={styles.scheduleConn} />}
                </div>

                <div className={styles.scheduleRight}>
                  <ScheduleCard
                    category={item.category}
                    placeName={item.place_name ?? "-"}
                    stayMinutes={item.stay_minutes}
                    address={item.address}
                    roadAddress={item.road_address}
                    image={item.place_image}
                    onClick={() => openPlaceDetail(item)}
                  />

                  {i < currentDay.length - 1 && (
                    <div className={styles.transportRow}>
                      <RiCarLine size={15} />
                      <span>{course.transport ?? "이동"}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.bottomSpacer} />
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {isEditable ? (
          <>
            <button
              className={styles.btnEdit}
              onClick={() => router.push(`/my-courses/${course.id}/edit`)}
            >
              <RiEditLine size={16} />
              편집
            </button>
            <button
              className={styles.btnShare}
              onClick={() => setShareOpen(true)}
            >
              <RiShareLine size={16} />
              공유하기
            </button>
          </>
        ) : (
          <>
            <button className={`${styles.btnEdit} ${styles.btnDelete}`} onClick={handleDelete}>
              <RiDeleteBinLine size={16} />
              삭제
            </button>
            <button
              className={styles.btnShare}
              onClick={() => router.push(`/my-courses/${course.id}/recruit`)}
            >
              <RiGroupLine size={16} />
              {canStartRecruit ? "동행 모집 전환" : "모집 설정"}
            </button>
          </>
        )}
      </div>

      {sheetMode === "view" && (
        <PlaceDetailSheet
          data={selectedPlace}
          onClose={closeSheets}
          onEdit={isEditable ? () => setSheetMode("edit") : undefined}
        />
      )}
      {sheetMode === "edit" && (
        <PlaceEditSheet
          data={selectedPlace}
          onClose={() => setSheetMode("view")}
          onDelete={handleDeletePlace}
          onSelectPlace={handleSelectPlace}
        />
      )}
      <ShareSheet
        course={shareOpen ? course : null}
        onClose={() => setShareOpen(false)}
        onShared={(updated) => { setCourse(updated); setShareOpen(false); }}
      />
    </div>
  );
}
