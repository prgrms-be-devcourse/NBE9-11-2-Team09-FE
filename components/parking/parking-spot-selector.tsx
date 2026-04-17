"use client";

import { useState, useEffect } from "react";
import { type ParkingSpot, SPOT_TYPE_LABELS, reservationApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ParkingSpotSelectorProps {
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  onSelect: (spot: ParkingSpot) => void;
  accessToken: string;
  parkingLotId: number;
}

export function ParkingSpotSelector({
  spots,
  selectedSpot,
  onSelect,
  accessToken,
  parkingLotId,
}: ParkingSpotSelectorProps) {
  const [localSpots, setLocalSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpotModal, setSelectedSpotModal] = useState<ParkingSpot | null>(null);

  useEffect(() => {
    if (spots && spots.length > 0) {
      setLocalSpots(spots);
    }
  }, [spots]);

  const handleReserve = async () => {
    if (!selectedSpotModal) return;

    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 2); 
      const end = new Date(now.getTime() + 60 * 60 * 1000);

      const formatToKST = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      };

      await reservationApi.create(accessToken, {
        parkingLotId,
        parkingSpotId: selectedSpotModal.id,
        startTime: formatToKST(now),
        endTime: formatToKST(end),
      });

      setLocalSpots((prev) =>
        prev.map((s) => (s.id === selectedSpotModal.id ? { ...s, status: "OCCUPIED" } : s))
      );

      onSelect({ ...selectedSpotModal, status: "OCCUPIED" });
      setSelectedSpotModal(null);
      
    } catch (e: any) {
      alert(e.message || "이미 다른 사용자가 선점했습니다.");
      setSelectedSpotModal(null);
    }
  };

  const getSpotStyles = (spot: ParkingSpot) => {
    // 1. 결제 중 상태 (노란색)
    if (spot.status === "PAYING") {
      return "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-80";
    }

    // 2. 선점/주차 중 상태 (회색)
    if (spot.status === "OCCUPIED" || spot.status === "PARKED") {
      return "bg-muted text-muted-foreground cursor-not-allowed opacity-50";
    }

    // 3. 주차 가능 상태 (차종별 색상 구분)
    switch (spot.type) {
      case "ELECTRIC":
        return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200";
      case "LARGE":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
      default: // SMALL
        return "bg-card hover:bg-muted border-border";
    }
  };

  const getStatusText = (status: ParkingSpot["status"]) => {
    const map: Record<ParkingSpot["status"], string> = {
      AVAILABLE: "가능",
      OCCUPIED: "사용중",
      PARKED: "주차중",
      PAYING: "결제중",
    };
    return map[status] ?? status;
  };

  const rows = Math.ceil(localSpots.length / 5);

  return (
    <div className="space-y-6">
      
      {/* 📌 구역 및 상태 안내 (범례) */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">구역 및 상태 안내</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-card border border-border" />
            <span className="text-muted-foreground font-medium">소형</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
            <span className="text-muted-foreground font-medium">대형</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
            <span className="text-muted-foreground font-medium">전기차</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
            <span className="text-amber-800 font-medium">결제 중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted opacity-50" />
            <span className="text-muted-foreground font-medium">선점/주차중</span>
          </div>
        </div>
      </div>

      {/* 🚙 주차 그리드 */}
      <div className="bg-muted/30 rounded-xl p-4 overflow-x-auto border">
        <div className="min-w-[400px]">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              ↓ 입구 방향
            </span>
          </div>

          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-2">
                {localSpots
                  .slice(rowIdx * 5, (rowIdx + 1) * 5)
                  .map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => spot.status === "AVAILABLE" && setSelectedSpotModal(spot)}
                      disabled={spot.status !== "AVAILABLE"}
                      className={cn(
                        "w-16 h-20 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all",
                        getSpotStyles(spot)
                      )}
                      title={`${spot.number}번 (${SPOT_TYPE_LABELS[spot.type]}) - ${getStatusText(spot.status)}`}
                    >
                      <span className="text-[10px] font-semibold opacity-70">
                        {SPOT_TYPE_LABELS[spot.type]}
                      </span>
                      <span className="text-sm font-bold">
                        {spot.number}
                      </span>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          <div className="h-8 border-y-2 border-dashed border-muted-foreground/30 my-4 flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground tracking-widest bg-muted/30 px-4 rounded-md">
              차 량 이 동 통 로
            </span>
          </div>
        </div>
      </div>

      {/* 선점 확인 모달 */}
      {selectedSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg border">
            <h3 className="text-lg font-semibold text-foreground mb-4">자리 선점 확인</h3>
            <div className="rounded-lg border bg-muted/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{selectedSpotModal.number}번 자리</p>
                  <p className="text-sm text-muted-foreground mt-1">{SPOT_TYPE_LABELS[selectedSpotModal.type]} 구역</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg border flex items-center justify-center", getSpotStyles(selectedSpotModal))}>
                   <Check className="w-6 h-6 opacity-70" />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              해당 자리를 선점하시겠습니까?<br/>선점 후 5분 이내에 결제를 완료해야 예약이 확정됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedSpotModal(null)} className="flex-1 h-10 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors">취소</button>
              <button onClick={handleReserve} className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">선점하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}