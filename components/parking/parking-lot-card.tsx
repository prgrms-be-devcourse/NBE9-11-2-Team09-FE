"use client";

import Link from "next/link";
import { MapPin, Clock3, Car, FileText, CalendarDays } from "lucide-react";
import { type ParkingLot } from "@/lib/api";

interface ParkingLotCardProps {
  parkingLot: ParkingLot;
}

export function ParkingLotCard({ parkingLot }: ParkingLotCardProps) {
  const formatTime = (t?: string) => (t ? t.substring(0, 5) : "-");

  return (
    <article className="rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-hover hover:shadow-[0_8px_20px_rgba(15,23,42,0.1)] md:px-8 md:py-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          {/* 왼쪽 아이콘 영역 */}
          <div className="flex h-[96px] w-[96px] shrink-0 flex-col items-center justify-center rounded-[16px] bg-[#eef4ff] md:h-[110px] md:w-[110px]">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#2563eb] text-white">
              <span className="text-[26px] font-bold">P</span>
            </div>
            <Car className="h-8 w-8 text-slate-600" />
          </div>

          {/* 중간 정보 영역 */}
          <div className="min-w-0 flex-1">
            <h2 className="mb-2 truncate text-[22px] font-bold text-slate-900 md:text-[24px]">
              {parkingLot.name}
            </h2>

            <div className="mb-3 inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[14px] font-semibold text-[#2563eb]">
              공영주차장
            </div>

            <div className="mb-4 flex items-center gap-2 text-[15px] text-slate-600 md:text-[16px]">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{parkingLot.address}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] text-slate-700 md:text-[16px]">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-slate-500" />
                <span>
                  운영시간 {formatTime(parkingLot.operationStartTime)} ~{" "}
                  {formatTime(parkingLot.operationEndTime)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[18px] font-medium text-slate-500">₩</span>
                <span>요금 {parkingLot.price.toLocaleString()}원</span>
              </div>

              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-slate-500" />
                <span>총 {parkingLot.totalSpot}면</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 버튼 영역 */}
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-[320px] xl:flex-col xl:justify-end">
          <Link
            href={`/parking-lots/${parkingLot.id}`}
            className="flex h-[46px] flex-1 items-center justify-center rounded-[10px] border border-[#8fb2ff] bg-white text-[16px] font-semibold text-[#4f7ef7] transition-colors hover:bg-slate-50 md:text-[18px]"
          >
            <FileText className="mr-2 h-4 w-4" />
            상세보기
          </Link>

          <Link
            href={`/reservations?parkingLotId=${parkingLot.id}`}
            className="flex h-[46px] flex-1 items-center justify-center rounded-[10px] bg-[#2563eb] text-[16px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] md:text-[18px]"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            예약하기
          </Link>
        </div>
      </div>
    </article>
  );
}