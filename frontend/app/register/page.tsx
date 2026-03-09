"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from "react-icons/ri";
import Input from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { authStorage, type TokenResponse } from "@/lib/auth";
import styles from "./page.module.scss";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    birthday: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.email) newErrors.email = "이메일을 입력해주세요";
    if (!form.password) newErrors.password = "비밀번호를 입력해주세요";
    if (form.password.length < 8) newErrors.password = "비밀번호는 8자 이상이어야 합니다";
    if (form.password !== form.passwordConfirm) newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    if (!form.nickname) newErrors.nickname = "닉네임을 입력해주세요";
    if (!form.birthday) newErrors.birthday = "생년월일을 입력해주세요";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setServerError("");
    setLoading(true);
    try {
      const data = await api.post<TokenResponse>("/api/auth/register", {
        email: form.email,
        password: form.password,
        nickname: form.nickname,
      });
      authStorage.setToken(data.access_token);
      router.push("/");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="뒤로가기">
          <RiArrowLeftLine size={24} />
        </button>
        <h1 className={styles.headerTitle}>회원가입</h1>
      </div>

      {/* 폼 */}
      <form className={styles.form} onSubmit={handleSubmit}>
        {serverError && <p className={styles.errorMsg}>{serverError}</p>}
        <Input
          label="이메일 *"
          type="email"
          name="email"
          placeholder="이메일을 입력하세요"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="비밀번호 *"
          type="password"
          name="password"
          placeholder="8자 이상 입력하세요"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          label="비밀번호 확인 *"
          type="password"
          name="passwordConfirm"
          placeholder="비밀번호를 다시 입력하세요"
          value={form.passwordConfirm}
          onChange={handleChange}
          error={errors.passwordConfirm}
          autoComplete="new-password"
        />
        <Input
          label="닉네임 *"
          type="text"
          name="nickname"
          placeholder="사용할 닉네임을 입력하세요"
          value={form.nickname}
          onChange={handleChange}
          error={errors.nickname}
        />
        <Input
          label="생년월일 *"
          type="date"
          name="birthday"
          value={form.birthday}
          onChange={handleChange}
          error={errors.birthday}
        />

        <div className={styles.bioWrap}>
          <label className={styles.bioLabel}>자기소개</label>
          <textarea
            name="bio"
            className={styles.bioInput}
            placeholder="간단한 자기소개를 작성해주세요 (선택)"
            value={form.bio}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "처리 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
}
