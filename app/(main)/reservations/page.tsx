"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { reservationApi, type Reservation, RESERVATION_STATUS_LABELS } from "@/lib/api";
import { Calendar, Clock, MapPin, Loader2, ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type TabType = "upcoming" | "past";

export default function ReservationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  useEffect(() => {
    const fetch = async () => {
      if (!user?.accessToken) return;
      try {
        const res = await reservationApi.getList(user.accessToken);
        setReservations(res.data);
      } catch {
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const days = ["일","월","화","수","목","금","토"];
    return {
      date: `${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`,
      time: `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`,
    };
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

  const isUpcoming = (r: Reservation) =>
    new Date(r.endTime) > new Date() && r.status !== "CANCELED" && r.status !== "COMPLETED";

  // PENDING 예약 → confirm 페이지로 이동
  const handleGoToPayment = (r: Reservation, e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 이벤트 막기
    sessionStorage.setItem(
      "pendingReservation",
      JSON.stringify({
        reservationId: r.reservationId,
        parkingLotId: r.parkingLotId,
        parkingLotName: r.parkingLotName,
        spotId: r.parkingSpotId,
        spotNumber: r.parkingSpotNumber,
        startTime: r.startTime,
        endTime: r.endTime,
        totalPrice: r.totalPrice,
      })
    );
    router.push("/reservation/confirm");
  };

  const filtered = reservations.filter(r =>
    activeTab === "upcoming" ? isUpcoming(r) : !isUpcoming(r)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">내 예약</h1>

        <div className="flex gap-2 mb-6">
          {(["upcoming","past"] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {tab === "upcoming" ? "예정된 예약" : "지난 예약"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground mb-2">
              {activeTab === "upcoming" ? "예정된 예약이 없습니다" : "지난 예약이 없습니다"}
            </p>
            {activeTab === "upcoming" && (
              <Link href="/parking-lots"><Button className="mt-2">주차장 찾기</Button></Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const s = formatDateTime(r.startTime);
              const e = formatDateTime(r.endTime);
              return (
                <Link key={r.reservationId} href={`/reservations/${r.reservationId}`}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-foreground/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{r.parkingLotName}</h3>
                        <p className="text-sm text-muted-foreground">{r.parkingSpotNumber}번 자리</p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusStyle(r.status))}>
                        {RESERVATION_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{s.date}</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{s.time} ~ {e.time}</span></div>
                    </div>

                    {/* PENDING 상태일 때만 결제하기 버튼 표시 */}
                    {r.status === "PENDING" ? (
                      <div className="pt-3 border-t border-border">
                        <button
                          onClick={(e) => handleGoToPayment(r, e)}
                          className="w-full h-10 rounded-lg bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          결제하기
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-3 border-t border-border">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}