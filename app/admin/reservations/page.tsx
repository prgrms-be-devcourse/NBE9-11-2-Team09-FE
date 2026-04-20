"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminReservationApi, RESERVATION_STATUS_LABELS, type ReservationStatus } from "@/lib/api";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchReservations = async (p = page) => {
    if (!user?.accessToken) return;
    setLoading(true);
    try {
      const res = await adminReservationApi.getList(user.accessToken, undefined, p);
      setReservations(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [user, page]);

  const handleCancel = async () => {
    if (!user?.accessToken || !selectedId) return;
    setCancellingId(selectedId);
    try {
      await adminReservationApi.cancel(user.accessToken, selectedId);
      setShowModal(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.message || "취소에 실패했습니다.");
    } finally {
      setCancellingId(null);
    }
  };

  const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-slate-100 text-slate-600",
    CANCELED: "bg-red-100 text-red-700",
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">예약 관리</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["예약ID", "회원", "주차장", "자리", "시작", "종료", "상태", "관리"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto" /></td></tr>
            ) : reservations.length === 0 ? (
              <tr><td colSpan={8} className="py-20 text-center text-slate-400">예약이 없습니다.</td></tr>
            ) : reservations.map((r) => (
              <tr key={r.reservationId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{r.reservationId}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{r.userName}</p>
                  <p className="text-xs text-slate-400">{r.userEmail}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.parkingLotName}</td>
                <td className="px-4 py-3 text-slate-600">{r.parkingSpotNumber}번</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(r.startTime)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(r.endTime)}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLE[r.status])}>
                    {RESERVATION_STATUS_LABELS[r.status as ReservationStatus]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <button
                      onClick={() => { setSelectedId(r.reservationId); setShowModal(true); }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                    >
                      강제취소
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 강제취소 확인 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">예약 강제 취소</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">예약 ID {selectedId}번을 강제 취소하시겠습니까? 결제 금액이 환불됩니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">취소</button>
              <button
                onClick={handleCancel}
                disabled={!!cancellingId}
                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 flex items-center justify-center"
              >
                {cancellingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "강제 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}