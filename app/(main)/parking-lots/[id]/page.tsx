"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { ParkingSpotSelector } from "@/components/parking/parking-spot-selector";
import { TimePicker } from "@/components/parking/time-picker";
import { Button } from "@/components/ui/button";
import { parkingLotApi, type ParkingLot, type ParkingSpot, toBackendDateTime } from "@/lib/api";
import { ArrowLeft, MapPin, Clock, Car, Zap, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ParkingLotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth(); // profile 추가
  const parkingLotId = Number(params.id);

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const fetchParkingLot = useCallback(async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    try {
      const res = await parkingLotApi.getDetail(user.accessToken, parkingLotId);
      setParkingLot(res.data);
    } catch {
      setParkingLot(null);
    } finally {
      setLoading(false);
    }
  }, [parkingLotId, user]);

  const fetchSpots = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const res = await parkingLotApi.getAvailableSpots(user.accessToken, parkingLotId);
      
      // 사용자 차량 종류와 일치하는 자리만 필터링하거나, 
      // Selector에서 선택 불가능하게 처리하기 위해 데이터를 가공합니다.
      const filteredSpots = res.data.map(spot => ({
        ...spot,
        // 사용자의 차종과 자리가 맞지 않으면 상태를 바꿔서 선택을 방지할 수 있습니다.
        isMismatched: profile?.vehicleType && spot.type !== profile.vehicleType
      }));
      
      setSpots(filteredSpots);
    } catch {
      setSpots([]);
    }
  }, [parkingLotId, user, profile]);

  useEffect(() => { 
    if (!authLoading && user?.accessToken) fetchParkingLot(); 
  }, [fetchParkingLot, authLoading, user]);

  useEffect(() => {
    if (!authLoading && user?.accessToken && step === 1) fetchSpots();
  }, [step, fetchSpots, authLoading, user]);

  const calculateTotalPrice = () => {
    if (!parkingLot || !startTime || !endTime) return 0;
    const mins = (endTime.getTime() - startTime.getTime()) / 60000;
    return Math.ceil(mins / 10) * parkingLot.price;
  };

  const handleProceedToReservation = () => {
    if (!selectedSpot || !startTime || !endTime || !parkingLot) return;
    const formatToLocalISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
    const data = {
      parkingLotId,
      parkingLotName: parkingLot.name,
      spotId: selectedSpot.id,
      spotNumber: selectedSpot.number,
      startTime: toBackendDateTime(formatToLocalISO(startTime)),
      endTime: toBackendDateTime(formatToLocalISO(endTime)),
      totalPrice: calculateTotalPrice(),
    };
    sessionStorage.setItem("pendingReservation", JSON.stringify(data));
    router.push("/reservation/confirm");
  };

  const formatTime = (t: string) => (t ? t.substring(0, 5) : "-");

  if (loading || authLoading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </div>
  );

  if (!parkingLot) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-medium mb-4">주차장 정보를 불러올 수 없습니다</p>
        <Link href="/parking-lots"><Button>목록으로 돌아가기</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* ... 주차장 정보 영역 생략 */}

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          {step === 1 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">주차 자리를 선택하세요</h2>
                {profile && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    내 차종: {profile.vehicleType === "SMALL" ? "경차" : profile.vehicleType === "LARGE" ? "대형" : "전기차"}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">※ 본인의 차량 종류와 일치하는 구역만 예약 가능합니다.</p>
              <ParkingSpotSelector 
                spots={spots.filter(s => !profile || s.type === profile.vehicleType)}
                selectedSpot={selectedSpot} 
                onSelect={setSelectedSpot}
                accessToken={user?.accessToken ?? ""}
                parkingLotId={parkingLotId}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">이용 시간을 선택하세요</h2>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>자리 변경</Button>
              </div>
              <TimePicker startTime={startTime} endTime={endTime} onStartTimeChange={setStartTime} onEndTimeChange={setEndTime} />
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">예상 결제 금액</p>
              <p className="text-2xl font-bold text-foreground">{calculateTotalPrice().toLocaleString()}원</p>
            </div>
            {step === 1 ? (
              <Button size="lg" onClick={() => setStep(2)} disabled={!selectedSpot} className="px-8">
                시간 선택하기
              </Button>
            ) : (
              <Button size="lg" onClick={handleProceedToReservation} disabled={!startTime || !endTime} className="px-8">
                예약하기
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}