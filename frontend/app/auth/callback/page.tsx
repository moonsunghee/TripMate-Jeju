"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authStorage } from "@/lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    if (token) {
      authStorage.setToken(token);
      router.replace("/");
    } else {
      router.replace("/login?error=" + (error ?? "oauth_failed"));
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        fontSize: 14,
        color: "#868e96",
      }}
    >
      로그인 처리 중...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
