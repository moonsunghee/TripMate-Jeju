const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// FastAPI 422는 detail이 [{msg, ...}] 배열 — 백엔드 커스텀 검증 메시지("Value error, ...")만 한국어라 그것만 노출
function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msg: unknown = detail[0]?.msg;
    if (typeof msg === "string" && msg.startsWith("Value error, ")) {
      return msg.slice("Value error, ".length);
    }
    return "입력값을 확인해 주세요.";
  }
  return "요청에 실패했습니다.";
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("mock_user");
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
      return null;
    }
    throw new ApiError(res.status, errorMessage(body.detail));
  }

  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path) as Promise<T>,
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }) as Promise<T>,
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }) as Promise<T>,
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }) as Promise<T>,
  delete: <T = null>(path: string) =>
    request<T>(path, { method: "DELETE" }) as Promise<T>,
};

export { ApiError };
