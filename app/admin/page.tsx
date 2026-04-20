"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminReservationApi, adminUserApi, adminPaymentApi } from "@/lib/api";
import { Users, CalendarDays, CreditCard, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, reservations: 0, payments: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.accessToken) return;
      try {
        const [usersRes, reservationsRes, paymentsRes] = await Promise.all([
          adminUserApi.getList(user.accessToken),
          adminReservationApi.getList(user.accessToken),
          adminPaymentApi.getAll(user.accessToken),
        ]);
        const payments = paymentsRes.data ?? [];
        const revenue = payments
          .filter((p: any) => p.status === "COMPLETE")
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        setStats({
          users: usersRes.data?.totalElements ?? 0,
          reservations: reservationsRes.data?.totalElements ?? 0,
          payments: payments.length,
          revenue,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const cards = [
    { label: "전체 회원", value: `${stats.users}명`, icon: Users, color: "bg-blue-500" },
    { label: "전체 예약", value: `${stats.reservations}건`, icon: CalendarDays, color: "bg-green-500" },
    { label: "전체 결제", value: `${stats.payments}건`, icon: CreditCard, color: "bg-purple-500" },
    { label: "총 매출", value: `${stats.revenue.toLocaleString()}원`, icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">대시보드</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}