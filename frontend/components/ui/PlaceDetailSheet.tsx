"use client";

import { RiArrowLeftLine, RiImageLine, RiTimeLine, RiPhoneLine, RiCheckboxBlankCircleLine } from "react-icons/ri";
import styles from "./PlaceDetailSheet.module.scss";

export interface PlaceDetailData {
  category?: string | null;
  time?: string | null;
  placeName: string;
  address?: string | null;
  memo?: string | null;
  image?: string | null;
  phone?: string | null;
  description?: string | null;
  options?: string[];
}

export default function PlaceDetailSheet({ data, onClose, onEdit }: { data: PlaceDetailData | null; onClose: () => void; onEdit?: () => void }) {
  if (!data) return null;

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="뒤로가기">
          <RiArrowLeftLine size={22} />
        </button>
        <span className={styles.headerTitle}>장소 상세</span>
        <span />
      </div>

      <div className={styles.scroll}>
        <div className={styles.imageWrap}>
          {data.image ? (
            <img src={data.image} alt={data.placeName} className={styles.image} />
          ) : (
            <RiImageLine size={40} className={styles.imagePlaceholder} />
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            {data.category && <span className={styles.category}>{data.category}</span>}
            {data.time && (
              <span className={styles.time}>
                <RiTimeLine size={14} />
                {data.time}
              </span>
            )}
          </div>

          <h1 className={styles.title}>{data.placeName}</h1>

          {data.address && (
            <div className={styles.infoRow}>
              <span className={styles.infoText}>{data.address}</span>
              <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard?.writeText(data.address ?? "")}
              >복사</button>
            </div>
          )}

          {data.phone && (
            <div className={styles.infoRow}>
              <RiPhoneLine size={16} className={styles.infoIcon} />
              <span className={styles.infoText}>{data.phone}</span>
            </div>
          )}

          {(data.memo || data.description) && (
            <p className={styles.description}>{data.description ?? data.memo}</p>
          )}

          {data.options && data.options.length > 0 && (
            <div className={styles.options}>
              {data.options.map((option) => (
                <div key={option} className={styles.optionItem}>
                  <RiCheckboxBlankCircleLine size={14} />
                  <span>{option}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {onEdit && (
        <div className={styles.bottomBar}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.editBtn} onClick={onEdit}>수정</button>
        </div>
      )}
    </div>
  );
}
