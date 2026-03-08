import type { Metadata, Viewport } from "next";
import LayoutShell from "@/components/layout/LayoutShell";
import "./globals.scss";

export const metadata: Metadata = {
  title: "TripMate Jeju",
  description: "AI 기반 제주 여행 코스 생성 및 동행 모집 플랫폼",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TripMate Jeju",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
