const TOKEN_KEY = "access_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    // Middleware가 읽을 수 있도록 쿠키에도 저장
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  },
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  },
  isLoggedIn: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
}
