"use client";

import { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, type, className, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrap}>
        <input
          type={inputType}
          className={`${styles.input} ${error ? styles.hasError : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
          </button>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
