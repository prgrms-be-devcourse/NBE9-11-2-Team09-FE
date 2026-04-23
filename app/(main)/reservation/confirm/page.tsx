"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { paymentApi, reservationApi } from "@/lib/api";
import {
  ArrowLeft, MapPin, Calendar, Clock,
  CreditCard, Loader2, AlertCircle, Shield,
} from "lucide-react";

interface PendingReservation {
  reservationId: number;
  parkingLotId: number;
  parkingLotName: string;
  spotId: number;
  spotNumber: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
}

export default function ReservationConfirmPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [reservation, setReservation] = useState<PendingReservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingReservation");
    if (stored) {
      setReservation(JSON.parse(stored));
    } else {
      router.push("/parking-lots");
    }
  }, [router]);

  // 5분 타이머 - 만료 시 alert + 주차장 목록으로 이동
  useEffect(() => {
    if (!reservation) return;

    timerRef.current = setTimeout(() => {
      sessionStorage.removeItem("pendingReservation");
      alert("결제 시간이 초과되었습니다. 예약이 자동 취소됩니다.");
      router.push("/parking-lots");
    }, 300000);

    

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timerRef.current!);
      clearInterval(countdown);
    };
  }, [reservation, router]);

  useEffect(() => {
  const onPopState = () => {
    const stored = sessionStorage.getItem("pendingReservation")
    if (stored && user?.accessToken) {
      const { reservationId } = JSON.parse(stored)
      fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'PATCH',
        keepalive: true,
        headers: { Authorization: `Bearer ${user.accessToken}` }
      })
      sessionStorage.removeItem("pendingReservation")
    }
  }
  window.addEventListener('popstate', onPopState)
  return () => window.removeEventListener('popstate', onPopState)
  }, [user?.accessToken])

  const formatTimeLeft = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleBack = async () => {
  if (reservation && user?.accessToken) {
    await reservationApi.cancel(user.accessToken, reservation.reservationId)
    sessionStorage.removeItem("pendingReservation")
  }
    router.back()
  }

  const isUrgent = timeLeft <= 60;

  const formatDateTime = (backendDt: string) => {
    const d = new Date(backendDt.replace(" ", "T"));
    const days = ["일","월","화","수","목","금","토"];
    return {
      date: `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`,
      time: `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`,
    };
  };

  const getDuration = () => {
    if (!reservation) return "";
    const diff = (new Date(reservation.endTime.replace(" ","T")).getTime()
      - new Date(reservation.startTime.replace(" ","T")).getTime()) / 60000;
    return diff < 60 ? `${diff}분` : `${diff/60}시간`;
  };

  const handleConfirm = async () => {
    if (!reservation || !user?.accessToken) return;
    clearTimeout(timerRef.current!);
    setLoading(true);
    setError(null);

    try {
      const payRes = await paymentApi.start(user.accessToken, {
        reservationId: reservation.reservationId,
        amount: reservation.totalPrice,
      });

      // 3. 토스 결제 페이지로 이동
      router.push(
          `/payment?parkingLotId=${reservation.parkingLotId}&parkingSpotId=${reservation.spotId}&startTime=${encodeURIComponent(reservation.startTime)}&endTime=${encodeURIComponent(reservation.endTime)}&price=${reservation.totalPrice}&paymentId=${payRes.data.paymentId}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 시작에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  const s = formatDateTime(reservation.startTime);
  const e = formatDateTime(reservation.endTime);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <button onClick={handleBack} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /><span>뒤로가기</span>
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-4">예약 확인</h1>

        {/* 타이머 배너 */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 mb-6 ${isUrgent ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
          <p className={`text-sm font-medium ${isUrgent ? "text-red-700" : "text-amber-700"}`}>
            자리가 선점되었습니다. 시간 내에 결제를 완료해주세요.
          </p>
          <span className={`text-xl font-extrabold tabular-nums ml-4 flex-shrink-0 ${isUrgent ? "text-red-600" : "text-amber-600"}`}>
            {formatTimeLeft()}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-foreground">예약 정보</h2>
          {[
            { icon: MapPin,   label: "주차장",   value: reservation.parkingLotName, sub: `${reservation.spotNumber}번 자리` },
            { icon: Calendar, label: "이용 날짜", value: s.date },
            { icon: Clock,    label: "이용 시간", value: `${s.time} ~ ${e.time} (${getDuration()})` },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
              <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
                {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">예약자 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">이름</span><span>{profile?.userName ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">이메일</span><span>{profile?.userEmail ?? "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">차량번호</span><span>{profile?.plateNumber ?? "-"}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">결제 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">주차 요금</span><span>{reservation.totalPrice.toLocaleString()}원</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">할인</span><span>0원</span></div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between"><span className="font-medium">총 결제 금액</span><span className="font-bold text-lg">{reservation.totalPrice.toLocaleString()}원</span></div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">결제 진행 시 이용약관에 동의하는 것으로 간주됩니다. 이용 시작 30분 전까지 취소 가능합니다.</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}

        <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4">
          <Button onClick={handleConfirm} disabled={loading} className="w-full h-12 text-base">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />결제 처리 중...</>
              : <><CreditCard className="w-5 h-5 mr-2" />{reservation.totalPrice.toLocaleString()}원 결제하기</>
            }
          </Button>
        </div>
      </main>
    </div>
  );
}