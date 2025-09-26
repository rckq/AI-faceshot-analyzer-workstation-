import type { Metadata } from "next";
import { Gamja_Flower } from "next/font/google";
import "./globals.css";

const gamjaFlower = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "💖 AI 프로필 사진 분석기 💖",
  description: "당신의 매력, AI가 찾아드려요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${gamjaFlower.className} antialiased`}>{children}</body>
    </html>
  );
}
