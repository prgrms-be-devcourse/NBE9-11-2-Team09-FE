"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Users, CalendarDays, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/users", label: "회원 관리", icon: Users },
  { href: "/admin/reservations", label: "예약 관리", icon: CalendarDays },
  { href: "/admin/payments", label: "결제 관리", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* 사이드바 */}
      <aside className="w-60 bg-[#1e293b] text-white flex flex-col fixed h-full">
        <div className="px-6 py-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center font-bold text-sm">P</div>
            <span className="font-bold text-[16px]">ParkEasy Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors",
                pathname === href
                  ? "bg-[#2563eb] text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-[14px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="ml-60 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}