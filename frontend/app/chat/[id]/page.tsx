"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiArrowLeftLine, RiMoreLine, RiSendPlaneFill } from "react-icons/ri";
import { api } from "@/lib/api";
import type { ChatMessage, DirectMessage } from "@/lib/types";
import { authStorage } from "@/lib/auth";
import styles from "./page.module.scss";

interface DisplayMessage {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  time: string;
  isMe: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getMeId(): number | null {
  const raw = localStorage.getItem("access_token");
  if (!raw) return null;
  try {
    const payload = JSON.parse(atob(raw.split(".")[1]));
    return Number(payload.sub);
  } catch { return null; }
}

export default function ChatRoomPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [roomName, setRoomName] = useState("채팅방");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGroup = id.startsWith("g");
  const numericId = parseInt(id.slice(1), 10);

  useEffect(() => {
    const meId = getMeId();
    if (isGroup) {
      setRoomName(`그룹 채팅 #${numericId}`);
      api.get<ChatMessage[]>(`/api/chat/rooms/${numericId}/messages`)
        .then((msgs) => {
          setMessages(msgs.map((m) => ({
            id: m.id,
            senderId: m.user_id,
            senderName: m.user?.nickname ?? "알 수 없음",
            text: m.message,
            time: formatTime(m.created_at),
            isMe: m.user_id === meId,
          })));
        }).catch(() => {});
    } else {
      api.get<DirectMessage[]>(`/api/chat/direct/${numericId}/messages`)
        .then((msgs) => {
          if (msgs.length > 0) {
            const other = msgs.find((m) => m.sender_id !== meId);
            setRoomName(other?.sender?.nickname ?? "1:1 채팅");
          }
          setMessages(msgs.map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender?.nickname ?? "알 수 없음",
            text: m.message,
            time: formatTime(m.created_at),
            isMe: m.sender_id === meId,
          })));
        }).catch(() => {});
    }
  }, [id, numericId, isGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    const meId = getMeId();
    const now = new Date().toISOString();
    const optimistic: DisplayMessage = {
      id: Date.now(),
      senderId: meId ?? 0,
      senderName: "나",
      text,
      time: formatTime(now),
      isMe: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    inputRef.current?.focus();

    try {
      if (isGroup) {
        await api.post(`/api/chat/rooms/${numericId}/messages`, { message: text });
      } else {
        await api.post(`/api/chat/direct/${numericId}/messages`, { message: text });
      }
    } catch {
      // 낙관적 업데이트 실패 시 제거
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <RiArrowLeftLine size={22} />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>{roomName}</span>
          {isGroup && <span className={styles.headerSub}>그룹</span>}
        </div>
        <button className={styles.moreBtn}>
          <RiMoreLine size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        <div className={styles.dateDivider}><span>오늘</span></div>

        {messages.length === 0 && (
          <p style={{ textAlign: "center", color: "#868e96", padding: "2rem", fontSize: "14px" }}>
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </p>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showAvatar = !msg.isMe && prev?.senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`${styles.msgRow} ${msg.isMe ? styles.msgRowMe : ""}`}>
              {!msg.isMe && (
                <div className={`${styles.msgAvatar} ${!showAvatar ? styles.msgAvatarHidden : ""}`}>
                  {msg.senderName[0]}
                </div>
              )}

              <div className={styles.msgGroup}>
                {showAvatar && <span className={styles.msgSenderName}>{msg.senderName}</span>}
                <div className={styles.msgBubbleRow}>
                  {msg.isMe && <span className={styles.msgTime}>{msg.time}</span>}
                  <div className={`${styles.msgBubble} ${msg.isMe ? styles.msgBubbleMe : ""}`}>
                    {msg.text}
                  </div>
                  {!msg.isMe && <span className={styles.msgTime}>{msg.time}</span>}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ""}`}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
        >
          <RiSendPlaneFill size={19} />
        </button>
      </div>
    </div>
  );
}
