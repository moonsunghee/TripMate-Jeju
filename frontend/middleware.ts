import { NextRequest, NextResponse } from "next/server";

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 미로그인 → 보호된 경로 접근 시 /login 으로
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname); // 로그인 후 원래 경로로 복귀
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인 → /login, /register 접근 시 홈으로
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일, _next 내부, favicon 제외하고 모든 경로에 적용
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
