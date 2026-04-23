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
      onSelect(null);
    } else {
      onSelect(spot);
    }
  };

  const getSpotStyles = (spot: ParkingSpot) => {
    if (spot.status === "PAYING") {
      return "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed opacity-80";
    }
    if (spot.status === "OCCUPIED") {
      return "bg-purple-50 text-purple-700 border-purple-200 cursor-not-allowed opacity-70";
    }
    if (spot.status === "PARKED") {
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
      OCCUPIED: "선점중",
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
            <div className="w-4 h-4 rounded bg-purple-50 border border-purple-200 opacity-70" />
            <span className="text-muted-foreground font-medium">선점 중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted opacity-50" />
            <span className="text-muted-foreground font-medium">주차 중</span>
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
                      "w-16 h-16 rounded-lg border-2 text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all",
                      getSpotStyles(spot)
                    )}
                  >
                    <span>{spot.number}</span>
                    <span className="text-[10px] opacity-75">{SPOT_TYPE_LABELS[spot.type]}</span>
                    <span className="text-[10px]">{getStatusText(spot.status)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}