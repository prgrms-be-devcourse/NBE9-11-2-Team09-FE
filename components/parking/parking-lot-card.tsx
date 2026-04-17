"use client";

import Link from "next/link";
import { MapPin, Clock, Car, Zap } from "lucide-react";
import { type ParkingLot } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ParkingLotCardProps {
  parkingLot: ParkingLot;
}

export function ParkingLotCard({ parkingLot }: ParkingLotCardProps) {
  // 백엔드에 availableSpots 없음 → totalSpot만 표시
  const formatTime = (t: string) => (t ? t.substring(0, 5) : "-");

  return (
    <Link href={`/parking-lots/${parkingLot.id}`}>
      <div className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-foreground/20 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {parkingLot.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{parkingLot.address}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {/* operationStartTime/operationEndTime: "HH:mm:ss" */}
            <span>{formatTime(parkingLot.operationStartTime)} ~ {formatTime(parkingLot.operationEndTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            {/* totalSpot: 총 면수 */}
            <span>총 {parkingLot.totalSpot}자리</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">기본 요금</span>
          </div>
          <div className="text-right">
            {/* price: 10분당 원 */}
            <span className="text-lg font-bold text-foreground">
              {parkingLot.price.toLocaleString()}원
            </span>
            <span className="text-xs text-muted-foreground">/10분</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
