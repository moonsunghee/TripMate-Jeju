"use client";

import Link from "next/link";
import { useState } from "react";
import { RiKakaoTalkFill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import Input from "@/components/ui/Input";
import styles from "./page.module.scss";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 API 연동
  };

  return (
    <div className={styles.page}>
      {/* 로고 영역 */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>🧭</div>
        <h1 className={styles.logoTitle}>TripMate Jeju</h1>
        <p className={styles.logoSubtitle}>제주 여행의 완벽한 동반자</p>
      </div>

      {/* 로그인 폼 */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="이메일"
          type="email"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <div className={styles.forgotWrap}>
          <Link href="/forgot-password" className={styles.forgotLink}>
            비밀번호 찾기
          </Link>
        </div>

        <button type="submit" className={styles.loginBtn}>
          로그인
        </button>
      </form>

      {/* 소셜 로그인 */}
      <div className={styles.dividerWrap}>
        <span className={styles.divider}>또는</span>
      </div>

      <div className={styles.socialBtns}>
        <button className={`${styles.socialBtn} ${styles.kakao}`}>
          <RiKakaoTalkFill size={22} />
          <span>카카오로 계속하기</span>
        </button>
        <button className={`${styles.socialBtn} ${styles.naver}`}>
          <span className={styles.naverN}>N</span>
          <span>네이버로 계속하기</span>
        </button>
        <button className={`${styles.socialBtn} ${styles.google}`}>
          <FcGoogle size={20} />
          <span>Google로 계속하기</span>
        </button>
      </div>

      {/* 회원가입 링크 */}
      <p className={styles.registerLink}>
        아직 계정이 없으신가요?{" "}
        <Link href="/register" className={styles.registerAnchor}>
          회원가입
        </Link>
      </p>
    </div>
  );
}
