const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
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
    throw new ApiError(res.status, body.detail ?? "요청에 실패했습니다.");
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
  delete: (path: string) =>
    request<never>(path, { method: "DELETE" }) as Promise<null>,
};

export { ApiError };
