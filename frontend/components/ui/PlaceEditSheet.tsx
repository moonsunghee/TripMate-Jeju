"use client";

import { useEffect, useState } from "react";
import { RiArrowLeftLine, RiImageLine, RiSearchLine, RiDeleteBinLine } from "react-icons/ri";
import { api } from "@/lib/api";
import type { Place } from "@/lib/types";
import type { PlaceDetailData } from "./PlaceDetailSheet";
import styles from "./PlaceEditSheet.module.scss";

export default function PlaceEditSheet({
  data,
  onClose,
  onDelete,
  onSelectPlace,
}: {
  data: PlaceDetailData | null;
  onClose: () => void;
  onDelete: () => void;
  onSelectPlace: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    setLoading(true);
    api.get<Place[]>(`/api/places?q=${encodeURIComponent(query)}&size=20`)
      .then(setCandidates)
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [data, query]);

  if (!data) return null;

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="뒤로가기">
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>장소 수정</span>
        <span />
      </div>

      <div className={styles.scroll}>
        <div className={styles.currentPlace}>
          <div className={styles.currentThumb}>
            {data.image ? (
              <img src={data.image} alt={data.placeName} className={styles.currentThumbImg} />
            ) : (
              <RiImageLine size={20} className={styles.currentThumbIcon} />
            )}
          </div>
          <div className={styles.currentInfo}>
            <span className={styles.currentName}>{data.placeName}</span>
            {data.address && <span className={styles.currentAddr}>{data.address}</span>}
          </div>
        </div>

        {!confirmingDelete ? (
          <button className={styles.deleteBtn} onClick={() => setConfirmingDelete(true)}>
            <RiDeleteBinLine size={16} />
            이 장소 삭제
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <span className={styles.confirmDeleteText}>정말 삭제할까요?</span>
            <div className={styles.confirmDeleteActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setConfirmingDelete(false)}>취소</button>
              <button className={styles.confirmDeleteBtn} onClick={onDelete}>삭제</button>
            </div>
          </div>
        )}

        <div className={styles.divider} />

        <p className={styles.sectionLabel}>다른 장소로 변경</p>
        <div className={styles.searchBox}>
          <RiSearchLine size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="장소명으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.candidateList}>
          {loading && <p className={styles.emptyText}>검색 중...</p>}
          {!loading && candidates.length === 0 && (
            <p className={styles.emptyText}>검색 결과가 없습니다</p>
          )}
          {!loading && candidates.map((place) => (
            <div key={place.id} className={styles.candidateItem}>
              <div className={styles.candidateThumb}>
                {place.place_image ? (
                  <img src={place.place_image} alt={place.place_name} className={styles.candidateThumbImg} />
                ) : (
                  <RiImageLine size={18} className={styles.candidateThumbIcon} />
                )}
              </div>
              <div className={styles.candidateInfo}>
                <span className={styles.candidateName}>{place.place_name}</span>
                <span className={styles.candidateAddr}>{place.address ?? place.region ?? "-"}</span>
              </div>
              <button className={styles.selectBtn} onClick={() => onSelectPlace(place)}>선택</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
