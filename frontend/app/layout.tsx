import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "TripMate Jeju",
  description: "AI 기반 제주 여행 코스 생성 및 동행 모집 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
