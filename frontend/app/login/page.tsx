"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiKakaoTalkFill } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import Input from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { authStorage, type TokenResponse } from "@/lib/auth";
import styles from "./page.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.post<TokenResponse>("/api/auth/demo", {});
      authStorage.setToken(data.access_token);
      const next = searchParams.get("next") ?? "/";
      router.push(next);
    } catch {
      setError("데모 로그인에 실패했습니다. 백엔드 서버를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError("");
    setLoading(true);
    try {
      const data = await api.post<TokenResponse>("/api/auth/login", { email, password });
      authStorage.setToken(data.access_token);
      const next = searchParams.get("next") ?? "/";
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
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
        {error && <p className={styles.errorMsg}>{error}</p>}
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

        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 데모 로그인 */}
      <div className={styles.dividerWrap}>
        <span className={styles.divider}>또는</span>
      </div>
      <button type="button" className={styles.demoBtn} onClick={handleDemoLogin}>
        🧭 회원가입 없이 둘러보기
      </button>

      {/* 소셜 로그인 */}
      <div className={styles.dividerWrap}>
        <span className={styles.divider}>소셜 로그인</span>
      </div>

      <div className={styles.socialBtns}>
        <button
          className={`${styles.socialBtn} ${styles.kakao}`}
          onClick={() => { window.location.href = `${API_URL}/api/auth/kakao/login`; }}
        >
          <RiKakaoTalkFill size={22} />
          <span>카카오로 계속하기</span>
        </button>
        <button
          className={`${styles.socialBtn} ${styles.naver}`}
          onClick={() => { window.location.href = `${API_URL}/api/auth/naver/login`; }}
        >
          <span className={styles.naverN}>N</span>
          <span>네이버로 계속하기</span>
        </button>
        <button
          className={`${styles.socialBtn} ${styles.google}`}
          onClick={() => { window.location.href = `${API_URL}/api/auth/google/login`; }}
        >
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
