"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RiSearchLine, RiGroupLine } from "react-icons/ri";
import { api } from "@/lib/api";
import type { ChatRoom, DirectRoom } from "@/lib/types";
import styles from "./page.module.scss";

type TabType = "all" | "group" | "direct";

interface UnifiedRoom {
  id: string;   // "g{id}" for group, "d{id}" for direct
  type: "group" | "direct";
  name: string;
  avatarText: string;
  time: string;
}

export default function ChatListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");
  const [groupRooms, setGroupRooms] = useState<ChatRoom[]>([]);
  const [directRooms, setDirectRooms] = useState<DirectRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ChatRoom[]>("/api/chat/rooms"),
      api.get<DirectRoom[]>("/api/chat/direct"),
    ]).then(([groups, directs]) => {
      setGroupRooms(groups);
      setDirectRooms(directs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allRooms: UnifiedRoom[] = [
    ...groupRooms.map((r) => ({
      id: `g${r.id}`,
      type: "group" as const,
      name: `그룹 채팅 #${r.post_id}`,
      avatarText: "그",
      time: r.created_at.slice(0, 10),
    })),
    ...directRooms.map((r) => ({
      id: `d${r.id}`,
      type: "direct" as const,
      name: r.other_user?.nickname ?? "알 수 없음",
      avatarText: (r.other_user?.nickname?.[0] ?? "?"),
      time: r.created_at.slice(0, 10),
    })),
  ];

  const filtered = allRooms.filter((r) => {
    if (tab === "all") return true;
    return tab === r.type;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>채팅</h1>
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
        {loading && (
          <p style={{ textAlign: "center", color: "#868e96", padding: "2rem" }}>로딩 중...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>채팅방이 없습니다</p>
        )}
        {filtered.map((room) => (
          <button
            key={room.id}
            className={styles.chatItem}
            onClick={() => router.push(`/chat/${room.id}`)}
          >
            <div className={`${styles.avatar} ${room.type === "group" ? styles.avatarGroup : ""}`}>
              {room.type === "group" ? <RiGroupLine size={20} /> : room.avatarText}
            </div>

            <div className={styles.chatInfo}>
              <div className={styles.chatTop}>
                <span className={styles.chatName}>{room.name}</span>
                <span className={styles.chatTime}>{room.time}</span>
              </div>
              <div className={styles.chatBottom}>
                <span className={styles.chatLastMsg}>
                  {room.type === "group" ? "그룹 채팅방" : "1:1 채팅"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
