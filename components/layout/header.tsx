"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Calendar, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-white">
            <Car className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">ParkEasy</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            메인
          </Link>
          <Link
            href="/reservations"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            예약내역
          </Link>
          <Link
            href="/mypage"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            마이페이지
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {profile?.userName ?? "사용자"}님
              </span>

              <Link href="/reservations" className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Calendar className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/mypage">
                <Button variant="ghost" size="icon" aria-label="마이페이지">
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="로그아웃"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
