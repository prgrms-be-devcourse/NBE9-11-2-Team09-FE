"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ParkingSpotSelector } from "@/components/parking/parking-spot-selector";
import { TimePicker } from "@/components/parking/time-picker";
import { Button } from "@/components/ui/button";
import { parkingLotApi, type ParkingLot, type ParkingSpot, toBackendDateTime } from "@/lib/api";
import { ArrowLeft, MapPin, Clock, Car, Zap, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

// 목데이터 - ParkingLotResDto 필드 기준
const MOCK_LOT: ParkingLot = {
  id: 1, name: "강남역 공영주차장", address: "서울 강남구 강남대로 396",
  totalSpot: 150, price: 1000, operationStartTime: "00:00:00", operationEndTime: "23:59:00",
};

// 목데이터 - ParkingSpotDto 필드 기준
const MOCK_SPOTS: ParkingSpot[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  number: `A${(i + 1).toString().padStart(2, "0")}`,
  type: (i < 3 ? "ELECTRIC" : i < 6 ? "LARGE" : "SMALL") as ParkingSpot["type"],
  status: (i % 5 === 0 ? "OCCUPIED" : i % 7 === 0 ? "PARKED" : "AVAILABLE") as ParkingSpot["status"],
}));

export default function ParkingLotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parkingLotId = Number(params.id);

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const fetchParkingLot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await parkingLotApi.getDetail(parkingLotId);
      setParkingLot(res.data);
    } catch {
      setParkingLot({ ...MOCK_LOT, id: parkingLotId });
    } finally {
      setLoading(false);
    }
  }, [parkingLotId]);

  const fetchSpots = useCallback(async () => {
    try {
      // GET /api/parking-spots/{lotId}/spots/available
      const res = await parkingLotApi.getAvailableSpots(parkingLotId);
      setSpots(res.data);
    } catch {
      setSpots(MOCK_SPOTS);
    }
  }, [parkingLotId]);

  useEffect(() => { fetchParkingLot(); }, [fetchParkingLot]);

  useEffect(() => {
    if (step === 2) fetchSpots();
  }, [step, fetchSpots]);

  // 예상 요금 계산 (10분당 price원)
  const calculateTotalPrice = () => {
    if (!parkingLot || !startTime || !endTime) return 0;
    const mins = (endTime.getTime() - startTime.getTime()) / 60000;
    return Math.ceil(mins / 10) * parkingLot.price;
  };

  const handleProceedToReservation = () => {
    if (!selectedSpot || !startTime || !endTime || !parkingLot) return;
    const data = {
      parkingLotId,
      parkingLotName: parkingLot.name,
      spotId: selectedSpot.id,
      // ParkingSpotDto: number 필드
      spotNumber: selectedSpot.number,
      // toBackendDateTime: "yyyy-MM-ddTHH:mm" → "yyyy-MM-dd HH:mm:ss"
      startTime: toBackendDateTime(startTime.toISOString().slice(0, 16)),
      endTime: toBackendDateTime(endTime.toISOString().slice(0, 16)),
      totalPrice: calculateTotalPrice(),
    };
    sessionStorage.setItem("pendingReservation", JSON.stringify(data));
    router.push("/reservation/confirm");
  };

  const formatTime = (t: string) => (t ? t.substring(0, 5) : "-");

  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
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
        <Link href="/parking-lots" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /><span>목록으로</span>
        </Link>

        {/* 주차장 정보 */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{parkingLot.name}</h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{parkingLot.address}</span></div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(parkingLot.operationStartTime)} ~ {formatTime(parkingLot.operationEndTime)}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">총 면수</p>
                <p className="font-semibold text-foreground">{parkingLot.totalSpot}자리</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">요금</p>
                <p className="font-semibold text-foreground">{parkingLot.price.toLocaleString()}원/10분</p>
              </div>
            </div>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-4 mb-6">
          {[{ n: 1, label: "시간 선택" }, { n: 2, label: "자리 선택" }].map(({ n, label }) => (
            <div key={n} className={`flex items-center gap-2 ${step === n ? "text-foreground" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === n ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>{n}</div>
              <span className="text-sm font-medium">{label}</span>
              {n < 2 && <div className="flex-1 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          {step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-4">이용 시간을 선택하세요</h2>
              <TimePicker startTime={startTime} endTime={endTime} onStartTimeChange={setStartTime} onEndTimeChange={setEndTime} />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">주차 자리를 선택하세요</h2>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>시간 변경</Button>
              </div>
              <ParkingSpotSelector spots={spots} selectedSpot={selectedSpot} onSelect={setSelectedSpot} />
            </>
          )}
        </div>

        {/* 하단 고정 버튼 */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">예상 결제 금액</p>
              <p className="text-2xl font-bold text-foreground">{calculateTotalPrice().toLocaleString()}원</p>
            </div>
            {step === 1 ? (
              <Button size="lg" onClick={() => setStep(2)} disabled={!startTime || !endTime} className="px-8">
                자리 선택하기
              </Button>
            ) : (
              <Button size="lg" onClick={handleProceedToReservation} disabled={!selectedSpot} className="px-8">
                예약하기
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
