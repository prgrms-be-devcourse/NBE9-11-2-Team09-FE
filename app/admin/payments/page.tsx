"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminPaymentApi, type AdminPayment } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    try {
      const res = await adminPaymentApi.getAll(user.accessToken);
      setPayments(res.data ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [user]);

  const STATUS_STYLE: Record<string, string> = {
    PROCESSING: "bg-yellow-100 text-yellow-700",
    COMPLETE: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    REFUND: "bg-slate-100 text-slate-600",
  };

  const STATUS_LABELS: Record<string, string> = {
    PROCESSING: "결제중",
    COMPLETE: "완료",
    FAILED: "실패",
    REFUND: "환불",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">결제 관리</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["결제ID", "회원", "예약ID", "금액", "상태", "결제일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto" /></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-slate-400">결제 내역이 없습니다.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.paymentId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{p.paymentId}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.userName}</td>
                <td className="px-4 py-3 text-slate-600">{p.reservationId}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{p.amount.toLocaleString()}원</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLE[p.status])}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}