"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { reservationApi, type Reservation, RESERVATION_STATUS_LABELS } from "@/lib/api";
import { ArrowLeft, Calendar, Clock, MapPin, Car, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MOCK: Reservation = {
  reservationId: 1, parkingLotName: "강남역 공영주차장", parkingSpotNumber: "A05",
  startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
  endTime:   new Date(Date.now() + 4 * 3600000).toISOString(),
  status: "CONFIRMED",
};

export default function ReservationDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const reservationId = Number(params.id);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservation = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const res = await reservationApi.getDetail(user.accessToken, reservationId);
      setReservation(res.data);
    } catch {
      setReservation({ ...MOCK, reservationId });
    } finally {
      setLoading(false);
    }
  }, [user, reservationId]);

  useEffect(() => { fetchReservation(); }, [fetchReservation]);

  const handleCancel = async () => {
    if (!user?.accessToken || !reservation) return;
    setCancelling(true);
    try {
      // PATCH /api/reservations/{id}/cancel — reservationId 사용
      await reservationApi.cancel(user.accessToken, reservation.reservationId);
      setReservation({ ...reservation, status: "CANCELED" });
      setShowCancelModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소에 실패했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const days = ["일","월","화","수","목","금","토"];
    return {
      date: `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`,
      time: `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`,
    };
  };

  const getDuration = () => {
    if (!reservation) return "";
    const diff = (new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / 60000;
    return diff < 60 ? `${diff}분` : `${diff/60}시간`;
  };

  const getStatusStyle = (status: Reservation["status"]) => {
    const map: Record<Reservation["status"], string> = {
      PENDING:   "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-muted text-muted-foreground",
      CANCELED:  "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  const canCancel = () => {
    if (!reservation) return false;
    const hoursBefore = (new Date(reservation.startTime).getTime() - Date.now()) / 3600000;
    return hoursBefore > 1 && (reservation.status === "PENDING" || reservation.status === "CONFIRMED");
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!reservation) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-medium mb-4">예약 정보를 찾을 수 없습니다</p>
        <Link href="/reservations"><Button>목록으로 돌아가기</Button></Link>
      </div>
    </div>
  );

  const s = formatDateTime(reservation.startTime);
  const e = formatDateTime(reservation.endTime);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <Link href="/reservations" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /><span>목록으로</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">예약 상세</h1>
          <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", getStatusStyle(reservation.status))}>
            {RESERVATION_STATUS_LABELS[reservation.status]}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-foreground">예약 정보</h2>
          {[
            { icon: MapPin, label: "주차장", value: reservation.parkingLotName },
            { icon: Car,    label: "주차 자리", value: `${reservation.parkingSpotNumber}번` },
            { icon: Calendar, label: "이용 날짜", value: s.date },
            { icon: Clock,  label: "이용 시간", value: `${s.time} ~ ${e.time} (${getDuration()})` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div>
            </div>
          ))}
        </div>

        {canCancel() && (
          <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowCancelModal(true)}>
            예약 취소
          </Button>
        )}
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">예약을 취소하시겠습니까?</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">예약 취소 시 결제 금액이 환불됩니다.</p>
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)} disabled={cancelling}>닫기</Button>
              <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "예약 취소"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
