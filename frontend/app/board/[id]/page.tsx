"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiArrowLeftLine, RiHeartLine, RiHeartFill,
  RiMessage2Line, RiShareLine, RiMapPinLine,
  RiCalendarLine, RiGroupLine, RiTimeLine,
  RiUserLine, RiCheckLine, RiAlertLine,
  RiStarFill, RiChat3Line,
} from "react-icons/ri";
import styles from "./page.module.scss";

// ============================================================
// Types & Mock Data
// ============================================================
interface Member {
  id: string;
  nickname: string;
  initial: string;
  color: string;
  isHost: boolean;
  joinedAt: string;
}

interface ScheduleItem {
  order: number;
  name: string;
  category: string;
  address: string;
  duration: string;
}

interface DaySchedule {
  day: number;
  date: string;
  items: ScheduleItem[];
}

interface PostDetail {
  id: string;
  type: "shared" | "recruiting";
  title: string;
  tags: string[];
  cardColor: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  authorScore: number;
  region: string;
  duration: string;
  startDate: string;
  endDate: string;
  deadline: string;
  current: number;
  max: number;
  ageGroup: string;
  gender: string;
  description: string;
  likes: number;
  comments: number;
  members: Member[];
  schedule: DaySchedule[];
}

const MOCK_DETAILS: Record<string, PostDetail> = {
  "2": {
    id: "2", type: "recruiting",
    title: "한라산 등반 같이 가요! 초보도 환영",
    tags: ["등산", "한라산", "도전"],
    cardColor: "#2D6A4F",
    author: "산악인", authorInitial: "산", authorColor: "#2D6A4F", authorScore: 4.8,
    region: "한라산 성판악 코스", duration: "당일치기",
    startDate: "2026-03-20", endDate: "2026-03-20", deadline: "2026-03-18",
    current: 1, max: 3, ageGroup: "20–40대", gender: "무관",
    description: "한라산 성판악 코스로 등반합니다. 초보자도 충분히 가능한 코스예요! 왕복 약 9.6km로 5–6시간 소요됩니다.\n\n출발 전날 제주 도착하시는 분 같이 저녁 식사도 좋아요 😊\n준비물: 등산화, 방풍자켓, 간식, 물 2L 이상",
    likes: 31, comments: 8,
    members: [
      { id: "1", nickname: "산악인", initial: "산", color: "#2D6A4F", isHost: true, joinedAt: "2026-03-05" },
    ],
    schedule: [
      {
        day: 1, date: "3월 20일 (금)",
        items: [
          { order: 1, name: "성판악 탐방안내소", category: "출발", address: "제주 제주시 조천읍 교래리 산 220-1", duration: "06:00 출발" },
          { order: 2, name: "속밭 대피소", category: "경유", address: "해발 1,400m 지점", duration: "약 2시간 소요" },
          { order: 3, name: "한라산 정상 (백록담)", category: "목적지", address: "해발 1,950m", duration: "약 3시간 소요" },
          { order: 4, name: "성판악 탐방안내소", category: "도착", address: "제주 제주시 조천읍 교래리 산 220-1", duration: "약 2.5시간 하산" },
        ],
      },
    ],
  },
  "4": {
    id: "4", type: "recruiting",
    title: "애월 서핑 동행 모집 3월 22일 출발",
    tags: ["서핑", "해양스포츠", "액티비티"],
    cardColor: "#1971C2",
    author: "서퍼킹", authorInitial: "서", authorColor: "#1971C2", authorScore: 4.6,
    region: "애월읍 곽지해수욕장", duration: "1박 2일",
    startDate: "2026-03-22", endDate: "2026-03-23", deadline: "2026-03-20",
    current: 3, max: 5, ageGroup: "20–30대", gender: "무관",
    description: "애월 곽지해수욕장에서 서핑 즐기실 분 모집합니다!\n초보자도 강습 받으면 당일 파도 탈 수 있어요. 강습비 별도 (약 5만원).\n\n숙소는 애월 게스트하우스 예약해뒀고, 2인 1실입니다.\n차량 있으신 분 우대 🚗",
    likes: 27, comments: 6,
    members: [
      { id: "1", nickname: "서퍼킹", initial: "서", color: "#1971C2", isHost: true, joinedAt: "2026-03-05" },
      { id: "2", nickname: "파도야", initial: "파", color: "#4DABF7", isHost: false, joinedAt: "2026-03-06" },
      { id: "3", nickname: "바다맘", initial: "바", color: "#74C0FC", isHost: false, joinedAt: "2026-03-07" },
    ],
    schedule: [
      {
        day: 1, date: "3월 22일 (일)",
        items: [
          { order: 1, name: "제주공항 집결", category: "출발", address: "제주특별자치도 제주시 공항로 2", duration: "10:00 집결" },
          { order: 2, name: "곽지 서핑 스쿨", category: "액티비티", address: "제주 제주시 애월읍 곽지리 1566", duration: "11:00–16:00" },
          { order: 3, name: "애월 해안도로 카페", category: "카페", address: "제주 제주시 애월읍 애월리", duration: "16:30–18:00" },
          { order: 4, name: "애월 게스트하우스", category: "숙소", address: "제주 제주시 애월읍", duration: "체크인 19:00" },
        ],
      },
      {
        day: 2, date: "3월 23일 (월)",
        items: [
          { order: 1, name: "협재 해수욕장", category: "관광", address: "제주 제주시 한림읍 협재리 2497-1", duration: "09:00–11:00" },
          { order: 2, name: "한림 수산시장", category: "맛집", address: "제주 제주시 한림읍 한림로 27", duration: "11:30–13:00" },
          { order: 3, name: "제주공항", category: "도착", address: "제주특별자치도 제주시 공항로 2", duration: "15:00 해산" },
        ],
      },
    ],
  },
  "6": {
    id: "6", type: "recruiting",
    title: "트레일러닝 제주 오름 투어 같이해요",
    tags: ["트레일", "러닝", "오름"],
    cardColor: "#E67700",
    author: "달리기왕", authorInitial: "달", authorColor: "#E67700", authorScore: 4.9,
    region: "제주시 오름 일대", duration: "1박 2일",
    startDate: "2026-03-21", endDate: "2026-03-22", deadline: "2026-03-19",
    current: 2, max: 4, ageGroup: "20–40대", gender: "무관",
    description: "제주 오름 트레일러닝 투어입니다. 새별오름, 다랑쉬오름 등 3개 오름을 달립니다.\n\n페이스는 km당 6–7분 정도로 느긋하게 갑니다. 러닝 경험자 환영!\n숙소는 제주시내 게스트하우스 예정.",
    likes: 18, comments: 4,
    members: [
      { id: "1", nickname: "달리기왕", initial: "달", color: "#E67700", isHost: true, joinedAt: "2026-03-04" },
      { id: "2", nickname: "오름러", initial: "오", color: "#FFA94D", isHost: false, joinedAt: "2026-03-06" },
    ],
    schedule: [
      {
        day: 1, date: "3월 21일 (토)",
        items: [
          { order: 1, name: "새별오름", category: "트레일", address: "제주 제주시 애월읍 봉성리 산 59-8", duration: "07:00–09:00" },
          { order: 2, name: "다랑쉬오름", category: "트레일", address: "제주 제주시 구좌읍 세화리 산 6", duration: "11:00–13:00" },
          { order: 3, name: "제주시내 게스트하우스", category: "숙소", address: "제주 제주시", duration: "체크인 18:00" },
        ],
      },
      {
        day: 2, date: "3월 22일 (일)",
        items: [
          { order: 1, name: "용눈이오름", category: "트레일", address: "제주 제주시 구좌읍 종달리 산 28", duration: "07:30–09:30" },
          { order: 2, name: "성산일출봉", category: "관광", address: "제주 서귀포시 성산읍 성산리 1", duration: "10:30–12:00" },
          { order: 3, name: "해산", category: "도착", address: "제주 제주시", duration: "15:00 해산" },
        ],
      },
    ],
  },
};

// 기본 상세 (목록에 있지만 상세 데이터 없는 경우)
function buildFallback(id: string): PostDetail {
  return {
    id, type: "recruiting",
    title: "모집 코스",
    tags: ["제주"],
    cardColor: "#2D6A4F",
    author: "작성자", authorInitial: "작", authorColor: "#2D6A4F", authorScore: 4.5,
    region: "제주", duration: "1박 2일",
    startDate: "2026-03-25", endDate: "2026-03-26", deadline: "2026-03-23",
    current: 1, max: 4, ageGroup: "무관", gender: "무관",
    description: "상세 정보를 준비 중입니다.",
    likes: 0, comments: 0,
    members: [{ id: "1", nickname: "작성자", initial: "작", color: "#2D6A4F", isHost: true, joinedAt: "2026-03-01" }],
    schedule: [],
  };
}

const CATEGORY_COLOR: Record<string, string> = {
  출발: "#52B788", 도착: "#52B788", 경유: "#868E96",
  목적지: "#F03E3E", 액티비티: "#1971C2", 트레일: "#E67700",
  관광: "#7950F2", 맛집: "#862E9C", 카페: "#F59F00", 숙소: "#495057",
};

// ============================================================
// Page
// ============================================================
export default function BoardDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const post = MOCK_DETAILS[id] ?? buildFallback(id);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [activeDay, setActiveDay] = useState(1);

  const isFull = post.current >= post.max;
  const fillPct = Math.round((post.current / post.max) * 100);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const daySchedule = post.schedule.find((s) => s.day === activeDay);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={handleLike}>
            {liked
              ? <RiHeartFill size={22} className={styles.likedIcon} />
              : <RiHeartLine size={22} />}
          </button>
          <button className={styles.iconBtn}>
            <RiShareLine size={22} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className={styles.scroll}>

        {/* Hero */}
        <div
          className={styles.hero}
          style={{ background: `linear-gradient(160deg, ${post.cardColor}bb, ${post.cardColor})` }}
        >
          <span className={styles.heroBadge}>
            <RiGroupLine size={13} /> 모집중
          </span>
          <h1 className={styles.heroTitle}>{post.title}</h1>
          <div className={styles.heroTags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.heroTag}>#{tag}</span>
            ))}
          </div>
        </div>

        {/* Recruit status card */}
        <div className={styles.recruitCard}>
          <div className={styles.recruitTop}>
            <span className={styles.recruitLabel}>모집 현황</span>
            <span className={styles.recruitFraction}>
              <strong>{post.current}</strong>/{post.max}명
            </span>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${fillPct}%`, background: post.cardColor }} />
          </div>
          <div className={styles.memberRow}>
            {post.members.map((m) => (
              <div key={m.id} className={styles.memberChip}>
                <div className={styles.memberAvatar} style={{ background: m.color }}>
                  {m.initial}
                </div>
                <span className={styles.memberName}>{m.nickname}</span>
                {m.isHost && <span className={styles.hostBadge}>방장</span>}
              </div>
            ))}
            {Array.from({ length: post.max - post.current }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.memberChip}>
                <div className={styles.memberAvatarEmpty}>
                  <RiUserLine size={14} />
                </div>
                <span className={styles.memberName}>모집중</span>
              </div>
            ))}
          </div>
          {isFull && (
            <div className={styles.fullNotice}>
              <RiAlertLine size={14} /> 모집이 마감되었습니다
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <RiMapPinLine size={16} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>여행지</p>
              <p className={styles.infoValue}>{post.region}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <RiCalendarLine size={16} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>여행 기간</p>
              <p className={styles.infoValue}>{post.startDate} – {post.endDate}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <RiTimeLine size={16} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>모집 마감</p>
              <p className={styles.infoValue}>{post.deadline}</p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <RiGroupLine size={16} className={styles.infoIcon} />
            <div>
              <p className={styles.infoLabel}>모집 조건</p>
              <p className={styles.infoValue}>{post.ageGroup} · {post.gender}</p>
            </div>
          </div>
        </div>

        {/* Author */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>작성자</p>
          <div className={styles.authorRow}>
            <div className={styles.authorAvatar} style={{ background: post.authorColor }}>
              {post.authorInitial}
            </div>
            <div className={styles.authorInfo}>
              <p className={styles.authorName}>{post.author}</p>
              <p className={styles.authorSub}>
                <RiStarFill size={12} className={styles.starIcon} />
                {post.authorScore} · 동행 {post.members.length - 1}회 완료
              </p>
            </div>
            <button className={styles.chatBtn}>
              <RiChat3Line size={15} /> 문의
            </button>
          </div>
        </div>

        {/* Description */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>소개</p>
          <p className={styles.description}>{post.description}</p>
        </div>

        {/* Schedule */}
        {post.schedule.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>여행 일정</p>

            {/* Day tabs */}
            <div className={styles.dayTabs}>
              {post.schedule.map((s) => (
                <button
                  key={s.day}
                  className={`${styles.dayTab} ${activeDay === s.day ? styles.dayTabActive : ""}`}
                  style={activeDay === s.day ? { background: post.cardColor, borderColor: post.cardColor } : {}}
                  onClick={() => setActiveDay(s.day)}
                >
                  {s.day}일차
                  <span className={styles.dayTabDate}>{s.date.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Schedule items */}
            {daySchedule && (
              <div className={styles.scheduleList}>
                <p className={styles.scheduleDate}>{daySchedule.date}</p>
                {daySchedule.items.map((item, idx) => (
                  <div key={item.order} className={styles.scheduleRow}>
                    {/* Timeline */}
                    <div className={styles.timeline}>
                      <div
                        className={styles.timelineDot}
                        style={{ background: CATEGORY_COLOR[item.category] ?? post.cardColor }}
                      />
                      {idx < daySchedule.items.length - 1 && (
                        <div className={styles.timelineLine} />
                      )}
                    </div>
                    {/* Card */}
                    <div className={styles.scheduleCard}>
                      <div className={styles.scheduleCardHead}>
                        <span
                          className={styles.categoryBadge}
                          style={{ color: CATEGORY_COLOR[item.category] ?? post.cardColor,
                                   background: `${CATEGORY_COLOR[item.category] ?? post.cardColor}18` }}
                        >
                          {item.category}
                        </span>
                        <span className={styles.scheduleTime}>{item.duration}</span>
                      </div>
                      <p className={styles.scheduleName}>{item.name}</p>
                      <p className={styles.scheduleAddr}><RiMapPinLine size={11} /> {item.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsRow}>
          <span className={styles.statItem}>
            {liked ? <RiHeartFill size={14} className={styles.likedIcon} /> : <RiHeartLine size={14} />}
            {likeCount}
          </span>
          <span className={styles.statItem}>
            <RiMessage2Line size={14} /> {post.comments}개 댓글
          </span>
        </div>

        {/* Bottom spacer for fixed bar */}
        <div className={styles.bottomSpacer} />
      </div>

      {/* Fixed bottom bar */}
      <div className={styles.bottomBar}>
        <button className={styles.commentBtn}>
          <RiMessage2Line size={18} />
          <span>{post.comments}</span>
        </button>
        <button
          className={`${styles.joinBtn} ${isFull ? styles.joinBtnDisabled : ""}`}
          style={!isFull ? { background: post.cardColor } : {}}
          disabled={isFull}
        >
          {isFull ? "모집 마감" : "동행 신청하기"}
        </button>
      </div>
    </div>
  );
}
