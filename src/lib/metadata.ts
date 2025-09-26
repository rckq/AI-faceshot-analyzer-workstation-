import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "💖 AI 프로필 사진 분석기 💖",
  description:
    "당신의 매력, AI가 찾아드려요! 베럴댄미가 제공하는 AI 프로필 사진 분석 서비스입니다.",
  keywords: [
    "프로필 사진",
    "AI 분석",
    "베럴댄미",
    "남성 그루밍",
    "프로필 촬영",
  ],
  authors: [{ name: "베럴댄미" }],
  openGraph: {
    title: "AI 프로필 사진 분석기",
    description: "당신의 매력, AI가 찾아드려요!",
    url: "https://faceshot-analyzer.netlify.app",
    siteName: "베럴댄미",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 프로필 사진 분석기",
    description: "당신의 매력, AI가 찾아드려요!",
  },
  viewport: "width=device-width, initial-scale=1.0",
  robots: {
    index: true,
    follow: true,
  },
};
