"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiArrowLeftLine, RiMoreLine, RiSendPlaneFill } from "react-icons/ri";
import styles from "./page.module.scss";

// ============================================================
// Types & Mock Data
// ============================================================
type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isMe: boolean;
};

const ROOM_NAMES: Record<string, string> = {
  g1: "제주 자연 힐링 코스",
  g2: "제주 미식 탐방 코스",
  g3: "제주 액티비티 코스",
  d1: "김제주",
  d2: "이올레",
};

const ROOM_MEMBER_COUNT: Record<string, number | undefined> = {
  g1: 4, g2: 3, g3: 5,
};

const INITIAL_MESSAGES: Message[] = [
  { id: "1", senderId: "u2", senderName: "김제주", text: "안녕하세요! 내일 코스 확인하셨나요?", time: "오전 10:05", isMe: false },
  { id: "2", senderId: "me", senderName: "나", text: "네, 확인했어요! 성산일출봉 먼저 가는 거죠?", time: "오전 10:07", isMe: true },
  { id: "3", senderId: "u3", senderName: "이올레", text: "맞아요~ 8시에 출발하면 될 것 같아요", time: "오전 10:10", isMe: false },
  { id: "4", senderId: "me", senderName: "나", text: "좋아요! 어디서 만날까요?", time: "오전 10:12", isMe: true },
  { id: "5", senderId: "u2", senderName: "김제주", text: "제주공항 1번 출구 어때요?", time: "오전 10:15", isMe: false },
  { id: "6", senderId: "u3", senderName: "이올레", text: "좋아요 거기서 봐요!", time: "오전 10:16", isMe: false },
  { id: "7", senderId: "me", senderName: "나", text: "내일 몇 시에 출발하나요?", time: "오후 3:12", isMe: true },
];

// ============================================================
// Page
// ============================================================
export default function ChatRoomPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const roomName = ROOM_NAMES[id] ?? "채팅방";
  const memberCount = ROOM_MEMBER_COUNT[id];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), senderId: "me", senderName: "나", text, time, isMe: true },
    ]);
    setInput("");
    inputRef.current?.focus();
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
          {memberCount && <span className={styles.headerSub}>{memberCount}명</span>}
        </div>
        <button className={styles.moreBtn}>
          <RiMoreLine size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        <div className={styles.dateDivider}>
          <span>오늘</span>
        </div>

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showAvatar = !msg.isMe && prev?.senderId !== msg.senderId;

          return (
            <div key={msg.id} className={`${styles.msgRow} ${msg.isMe ? styles.msgRowMe : ""}`}>
              {/* Avatar (received only) */}
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
          disabled={!input.trim()}
        >
          <RiSendPlaneFill size={19} />
        </button>
      </div>
    </div>
  );
}
