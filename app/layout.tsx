import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ParkEasy - 스마트 주차 예약",
  description: "간편하게 주차장을 검색하고 예약하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans bg-background">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
