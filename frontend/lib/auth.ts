const TOKEN_KEY = "access_token";
const MOCK_USER_KEY = "mock_user";
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
    localStorage.removeItem(MOCK_USER_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  },
  isLoggedIn: (): boolean => !!localStorage.getItem(TOKEN_KEY),

  // 데모 로그인용 mock 유저 저장
  setMockUser: (user: UserResponse) => {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  },
  getMockUser: (): UserResponse | null => {
    const raw = localStorage.getItem(MOCK_USER_KEY);
    return raw ? (JSON.parse(raw) as UserResponse) : null;
  },
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
