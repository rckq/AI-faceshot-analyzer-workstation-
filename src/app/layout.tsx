import type { Metadata } from "next";
import { Gamja_Flower } from "next/font/google";
import { metadata as siteMetadata } from "@/lib/metadata";
import "./globals.css";

const gamjaFlower = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gamja",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={gamjaFlower.variable}>
      <body className="font-gamja">{children}</body>
    </html>
  );
}
