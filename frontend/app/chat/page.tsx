"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiSearchLine, RiGroupLine } from "react-icons/ri";
import styles from "./page.module.scss";

// ============================================================
// Types & Mock Data
// ============================================================
type ChatRoom = {
  id: string;
  type: "group" | "direct";
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatarText: string;
  memberCount?: number;
};

const MOCK_CHATS: ChatRoom[] = [
  { id: "g1", type: "group", name: "제주 자연 힐링 코스", lastMessage: "내일 몇 시에 출발하나요?", time: "오후 3:12", unread: 2, avatarText: "힐", memberCount: 4 },
  { id: "g2", type: "group", name: "제주 미식 탐방 코스", lastMessage: "흑돼지 맛집 예약했어요!", time: "어제", unread: 0, avatarText: "미", memberCount: 3 },
  { id: "g3", type: "group", name: "제주 액티비티 코스", lastMessage: "서핑 장비 대여 얼마예요?", time: "월요일", unread: 5, avatarText: "액", memberCount: 5 },
  { id: "d1", type: "direct", name: "김제주", lastMessage: "네, 같이 가요!", time: "오후 1:30", unread: 1, avatarText: "김" },
  { id: "d2", type: "direct", name: "이올레", lastMessage: "프로필 사진 귀엽네요 ㅎㅎ", time: "화요일", unread: 0, avatarText: "이" },
];

type TabType = "all" | "group" | "direct";

// ============================================================
// Page
// ============================================================
export default function ChatListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");

  const filtered = MOCK_CHATS.filter((c) => {
    if (tab === "all") return true;
    return tab === "group" ? c.type === "group" : c.type === "direct";
  });

  const totalUnread = MOCK_CHATS.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          채팅
          {totalUnread > 0 && <span className={styles.headerBadge}>{totalUnread}</span>}
        </h1>
        <button className={styles.iconBtn}>
          <RiSearchLine size={22} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["all", "group", "direct"] as TabType[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "전체" : t === "group" ? "그룹" : "1:1"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <p className={styles.empty}>채팅방이 없습니다</p>
        )}
        {filtered.map((chat) => (
          <button
            key={chat.id}
            className={styles.chatItem}
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <div className={`${styles.avatar} ${chat.type === "group" ? styles.avatarGroup : ""}`}>
              {chat.type === "group" ? <RiGroupLine size={20} /> : chat.avatarText}
            </div>

            <div className={styles.chatInfo}>
              <div className={styles.chatTop}>
                <span className={styles.chatName}>{chat.name}</span>
                {chat.type === "group" && chat.memberCount && (
                  <span className={styles.memberCount}>{chat.memberCount}</span>
                )}
                <span className={styles.chatTime}>{chat.time}</span>
              </div>
              <div className={styles.chatBottom}>
                <span className={styles.chatLastMsg}>{chat.lastMessage}</span>
                {chat.unread > 0 && (
                  <span className={styles.unreadBadge}>{chat.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
