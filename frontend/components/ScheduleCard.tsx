import type { IconType } from "react-icons";
import {
  RiMapPin2Line, RiRestaurantLine, RiCupLine, RiHome2Line, RiMoonLine,
  RiWalkLine, RiAnchorLine, RiRunLine, RiFlag2Line, RiTimeLine, RiImageLine,
  RiParkingBoxLine, RiTakeawayLine, RiCalendarCheckLine, Ri24HoursLine, RiBearSmileLine, RiDoorLine,
} from "react-icons/ri";
import styles from "./ScheduleCard.module.scss";

const CATEGORY_ICONS: Record<string, IconType> = {
  restaurant: RiRestaurantLine, 조식: RiRestaurantLine, 중식: RiRestaurantLine, 석식: RiRestaurantLine,
  dessert: RiCupLine, 디저트: RiCupLine, 카페: RiCupLine,
  nightfood: RiMoonLine, 야식: RiMoonLine,
  tourist: RiMapPin2Line, 관광지: RiMapPin2Line, 관광: RiMapPin2Line,
  accommodation: RiHome2Line, 숙소: RiHome2Line,
  트레킹: RiWalkLine, 등반: RiWalkLine,
  액티비티: RiAnchorLine, 서핑: RiAnchorLine, 카약: RiAnchorLine,
  러닝: RiRunLine, 트레일: RiRunLine,
  골프: RiFlag2Line,
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "식당", dessert: "카페·디저트", nightfood: "야식", tourist: "관광지", accommodation: "숙소",
};

export const PLACE_OPTIONS: { label: string; icon: IconType }[] = [
  { label: "주차", icon: RiParkingBoxLine },
  { label: "포장", icon: RiTakeawayLine },
  { label: "예약", icon: RiCalendarCheckLine },
  { label: "24시간", icon: Ri24HoursLine },
  { label: "반려동반", icon: RiBearSmileLine },
  { label: "화장실", icon: RiDoorLine },
];

export function formatStay(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

function AddressRow({ text }: { text: string }) {
  return (
    <div className={styles.addrRow}>
      <span className={styles.addr} title={text}>{text.replace(/^제주(특별자치도|도)\s*/, "")}</span>
      <button
        type="button"
        className={styles.copyBtn}
        onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(text); }}
      >
        복사
      </button>
    </div>
  );
}

export default function ScheduleCard({
  category, placeName, stayMinutes, address, roadAddress, image, onClick,
}: {
  category: string | null;
  placeName: string;
  stayMinutes: number | null | undefined;
  address: string | null | undefined;
  roadAddress: string | null | undefined;
  image?: string | null;
  onClick?: () => void;
}) {
  const Icon = CATEGORY_ICONS[category ?? ""] ?? RiMapPin2Line;
  const stay = formatStay(stayMinutes);
  const categoryLabel = CATEGORY_LABELS[category ?? ""] ?? category ?? "장소";

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
    >
      <div className={styles.top}>
        <Icon size={20} className={styles.categoryIcon} aria-label={categoryLabel} role="img" />
        <span className={styles.title}>{placeName}</span>
        {stay && (
          <span className={styles.stay}>
            <RiTimeLine size={15} />
            {stay}
          </span>
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.thumb}>
          {image ? (
            <img src={image} alt={placeName} className={styles.thumbImg} />
          ) : (
            <RiImageLine size={22} className={styles.thumbIcon} />
          )}
        </div>
        <div className={styles.body}>
          {address && <AddressRow text={address} />}
          {roadAddress && roadAddress !== address && <AddressRow text={roadAddress} />}
          <div className={styles.options}>
            {PLACE_OPTIONS.map(({ label, icon: OptionIcon }) => (
              <span key={label} className={styles.option}>
                <OptionIcon size={16} />
                <span className={styles.optionLabel}>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
