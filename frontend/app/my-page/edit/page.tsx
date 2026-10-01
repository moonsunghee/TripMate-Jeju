"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";
import { api, ApiError } from "@/lib/api";
import type { UserResponse } from "@/lib/auth";
import styles from "./page.module.scss";

const MIN_NICKNAME_LENGTH = 2;
const MAX_BIO_LENGTH = 200;

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserResponse>("/api/auth/me")
      .then((u) => {
        setNickname(u.nickname);
        setBio(u.bio ?? "");
      })
      .catch(() => setError("프로필을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const trimmedNickname = nickname.trim();
  const nicknameInvalid = trimmedNickname.length < MIN_NICKNAME_LENGTH;
  const canSave = !loading && !saving && !nicknameInvalid && bio.length <= MAX_BIO_LENGTH;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch<UserResponse>("/api/auth/me", { nickname: trimmedNickname, bio });
      router.replace("/my-page");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로가기">
          <RiArrowLeftLine size={22} />
        </button>
        <h1 className={styles.headerTitle}>프로필 편집</h1>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>

      {loading ? (
        <p className={styles.message}>불러오는 중...</p>
      ) : (
        <div className={styles.form}>
          <div className={styles.avatar}>{trimmedNickname[0]?.toUpperCase() ?? "?"}</div>

          <label className={styles.field}>
            <span className={styles.label}>닉네임</span>
            <input
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
            {nicknameInvalid && (
              <span className={styles.hint}>닉네임은 {MIN_NICKNAME_LENGTH}자 이상이어야 합니다.</span>
            )}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>자기소개</span>
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="나를 소개해 주세요"
              rows={4}
              maxLength={MAX_BIO_LENGTH}
            />
            <span className={styles.counter}>{bio.length}/{MAX_BIO_LENGTH}</span>
          </label>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
}
