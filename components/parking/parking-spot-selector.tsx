"use client";

import { type ParkingSpot, SPOT_TYPE_LABELS } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ParkingSpotSelectorProps {
  spots: ParkingSpot[];
  selectedSpot: ParkingSpot | null;
  onSelect: (spot: ParkingSpot) => void;
}

export function ParkingSpotSelector({ spots, selectedSpot, onSelect }: ParkingSpotSelectorProps) {
  const getSpotStyles = (spot: ParkingSpot) => {
    const isSelected = selectedSpot?.id === spot.id;
    const isAvailable = spot.status === "AVAILABLE";

    if (!isAvailable) return "bg-muted text-muted-foreground cursor-not-allowed opacity-50";
    if (isSelected) return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2";

    switch (spot.type) {
      case "ELECTRIC": return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200";
      case "LARGE":    return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
      default:         return "bg-card hover:bg-muted border-border";
    }
  };

  const getStatusText = (status: ParkingSpot["status"]) => {
    const map: Record<ParkingSpot["status"], string> = {
      AVAILABLE: "가능", OCCUPIED: "사용중", PARKED: "주차중", PAYING: "정산중",
    };
    return map[status] ?? status;
  };

  const rows = Math.ceil(spots.length / 5);

  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-card border border-border" /><span className="text-muted-foreground">일반</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-50 border border-green-200" /><span className="text-muted-foreground">전기차</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" /><span className="text-muted-foreground">대형</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted opacity-50" /><span className="text-muted-foreground">불가</span></div>
      </div>

      {/* 주차 자리 그리드 */}
      <div className="bg-muted/30 rounded-xl p-4 overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="text-center mb-4"><span className="text-xs text-muted-foreground">↓ 입구</span></div>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-2">
                {spots.slice(rowIdx * 5, (rowIdx + 1) * 5).map(spot => (
                  <button
                    key={spot.id}
                    onClick={() => spot.status === "AVAILABLE" && onSelect(spot)}
                    disabled={spot.status !== "AVAILABLE"}
                    className={cn("w-16 h-20 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all", getSpotStyles(spot))}
                    title={`${spot.number} (${SPOT_TYPE_LABELS[spot.type]}) - ${getStatusText(spot.status)}`}
                  >
                    {selectedSpot?.id === spot.id
                      ? <Check className="w-4 h-4" />
                      : <span className="text-xs">{SPOT_TYPE_LABELS[spot.type]}</span>
                    }
                    {/* ParkingSpotDto: number 필드 */}
                    <span className="text-xs font-medium">{spot.number}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="h-8 border-y-2 border-dashed border-muted-foreground/30 my-4 flex items-center justify-center">
            <span className="text-xs text-muted-foreground bg-muted/30 px-2">차로</span>
          </div>
        </div>
      </div>

      {/* 선택된 자리 */}
      {selectedSpot && (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">선택한 자리: {selectedSpot.number}</p>
              <p className="text-sm text-muted-foreground">{SPOT_TYPE_LABELS[selectedSpot.type]} 구역</p>
            </div>
            <Check className="w-6 h-6 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
