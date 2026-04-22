"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Car, LogOut, User, Calendar } from "lucide-react";

export function Header() {
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/parking-lots" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-foreground rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-background" />
          </div>
          <span className="text-lg font-semibold">ParkEasy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/parking-lots" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            주차장 찾기
          </Link>
          <Link href="/reservations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            내 예약
          </Link>
          <Link href="/mypage" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            마이페이지
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* user(TokenData)에는 name 없으므로 profile에서 가져옴 */}
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {profile?.userName}님
              </span>
              <Link href="/reservations">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Calendar className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/mypage">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
