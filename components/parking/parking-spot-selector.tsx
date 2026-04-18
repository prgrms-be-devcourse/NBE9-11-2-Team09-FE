"use client";

import { useState, useEffect } from "react";
import { type ParkingSpot, SPOT_TYPE_LABELS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ParkingSpotSelectorProps {
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  onSelect: (spot: ParkingSpot | null) => void;
}

export function ParkingSpotSelector({
  spots,
  selectedSpot,
  onSelect,
}: ParkingSpotSelectorProps) {
  const [localSpots, setLocalSpots] = useState<ParkingSpot[]>([]);

  useEffect(() => {
    if (spots && spots.length > 0) {
      setLocalSpots(spots);
    }
  }, [spots]);

  const handleSpotClick = (spot: ParkingSpot) => {
    if (spot.status !== "AVAILABLE") return;
    if (selectedSpot?.id === spot.id) {
      onSelect(null); // 같은 자리 재클릭 시 선택 해제
    } else {
      onSelect(spot);
    }
  };

  const getSpotStyles = (spot: ParkingSpot) => {
    if (spot.status === "PAYING") {
      return "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-80";
    }
    if (spot.status === "OCCUPIED" || spot.status === "PARKED") {
      return "bg-muted text-muted-foreground cursor-not-allowed opacity-50";
    }
    if (selectedSpot?.id === spot.id) {
      return "bg-[#2563eb] text-white border-[#2563eb] ring-2 ring-[#2563eb] ring-offset-1";
    }
    switch (spot.type) {
      case "ELECTRIC":
        return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200";
      case "LARGE":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
      default:
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
      {/* 범례 */}
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#2563eb]" />
            <span className="text-muted-foreground font-medium">선택됨</span>
          </div>
        </div>
      </div>

      {/* 주차 그리드 */}
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
                {localSpots.slice(rowIdx * 5, (rowIdx + 1) * 5).map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot)}
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
                    <span className="text-sm font-bold">{spot.number}</span>
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

      {/* 선택된 자리 안내 */}
      {selectedSpot && (
        <div className="rounded-lg border border-[#2563eb] bg-[#eef4ff] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {selectedSpot.number}
          </div>
          <div>
            <p className="font-semibold text-[#2563eb]">{selectedSpot.number}번 자리 선택됨</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {SPOT_TYPE_LABELS[selectedSpot.type]} 구역 · 시간 선택하기를 눌러 계속하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}