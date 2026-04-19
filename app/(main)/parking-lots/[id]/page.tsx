"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { parkingLotApi, type ParkingLot } from "@/lib/api";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock3,
  Loader2,
  AlertCircle,
  MapPin,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(value?: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}
function formatPrice(value?: number) {
  if (value === undefined || value === null) return "-";
  return `${value.toLocaleString()}원`;
}

export default function ParkingLotDetailPage() {
  // ----------------------------
  // 5. URL 파라미터에서 주차장 id 추출
  // ----------------------------
  // 예: /parking-lots/3 → id = "3"
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const parkingLotId = Number(params?.id);

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParkingLot = useCallback(async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await parkingLotApi.getDetail(user.accessToken, parkingLotId);
      setParkingLot(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "주차장 상세 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [parkingLotId, user]);

  // ----------------------------
  // 8. 화면 최초 진입 / id 변경 시 상세 조회 실행
  // ----------------------------
  useEffect(() => {
    if (!authLoading && user?.accessToken) fetchParkingLot();
  }, [fetchParkingLot, authLoading, user]);

  // ── 로딩 ──
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f6fb]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      </div>
    );
  }

  // ── 에러 / 데이터 없음 ──
  if (error || !parkingLot) {
    return (
      <div className="min-h-screen bg-[#f3f6fb]">
        <Header />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 font-medium text-red-500">
            {error ?? "주차장 정보를 불러올 수 없습니다."}
          </p>
          <Link href="/parking-lots">
            <Button>목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      icon: <Clock3 className="h-5 w-5 text-[#2563eb]" />,
      label: "운영 시간",
      value: `${formatTime(parkingLot.operationStartTime)} ~ ${formatTime(parkingLot.operationEndTime)}`,
      sub: "운영시간 기준 정보",
    },
    {
      icon: <Wallet className="h-5 w-5 text-[#2563eb]" />,
      label: "요금",
      value: formatPrice(parkingLot.price),
      sub: "10분당 요금",
    },
    {
      icon: <Car className="h-5 w-5 text-[#2563eb]" />,
      label: "총 주차면수",
      value: `${parkingLot.totalSpot.toLocaleString()}면`,
      sub: "전체 주차 가능 구획 수",
    },
  ];

  const tableRows = [
    { label: "주차장명", value: parkingLot.name },
    { label: "주소", value: parkingLot.address },
    {
      label: "운영시간",
      value: `${formatTime(parkingLot.operationStartTime)} ~ ${formatTime(parkingLot.operationEndTime)}`,
    },
    { label: "요금", value: formatPrice(parkingLot.price) },
    { label: "주차면수", value: `총 ${parkingLot.totalSpot.toLocaleString()}면` },
  ];

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 pb-14 md:px-6">

        {/* 뒤로가기 */}
        <section className="py-6">
          <Link
            href="/parking-lots"
            className="inline-flex items-center gap-2 text-[16px] font-medium text-[#2563eb]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </section>

        {/* 상단: 이름 + 배지 + 주소 + 예약 버튼 */}
        <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[34px] font-extrabold tracking-[-0.03em] md:text-[48px]">
                {parkingLot.name}
              </h1>
              <span className="rounded-full bg-[#eef4ff] px-4 py-1.5 text-[16px] font-bold text-[#2563eb]">
                공영주차장
              </span>
            </div>
            <div className="flex items-center gap-2 text-[18px] text-slate-600 md:text-[20px]">
              <MapPin className="h-5 w-5 shrink-0 text-[#2563eb]" />
              {parkingLot.address}
            </div>
          </div>

          {/* 예약하기 → /reserve 로 이동 */}
          <Link
            href={`/parking-lots/${parkingLotId}/reserve`}
            className="flex h-[56px] w-full items-center justify-center rounded-[12px] bg-[#2563eb] px-8 text-[18px] font-bold text-white hover:bg-[#1d4ed8] lg:w-[220px]"
          >
            <CalendarDays className="mr-3 h-5 w-5" />
            예약하기
          </Link>
        </section>

        {/* 정보 카드 영역 */}
        <section className="rounded-[24px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-8 md:py-8">

          {/* 요약 카드 3개 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaryCards.map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className="rounded-[18px] border border-[#e4eefc] bg-[#f8fbff] px-6 py-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff]">
                    {icon}
                  </div>
                  <span className="text-[16px] font-bold text-slate-700">{label}</span>
                </div>
                <p className="text-[26px] font-extrabold text-slate-900">{value}</p>
                <p className="mt-2 text-[14px] font-medium text-slate-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* 기본 정보 테이블 */}
          <section className="mt-8">
            <h2 className="mb-4 text-[22px] font-extrabold tracking-[-0.02em] text-slate-900">
              기본 정보
            </h2>
            <div className="overflow-hidden rounded-[12px] border border-slate-200">
              {tableRows.map(({ label, value }, idx) => (
                <div
                  key={label}
                  className={`grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] ${
                    idx < tableRows.length - 1 ? "border-b border-slate-200" : ""
                  }`}
                >
                  <div className="bg-slate-50 px-4 py-4 text-[15px] font-bold text-slate-600 md:px-5">
                    {label}
                  </div>
                  <div className="px-4 py-4 text-[15px] font-semibold text-slate-800 md:px-5">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 이용 안내 */}
          <section className="mt-8">
            <h2 className="mb-4 text-[22px] font-extrabold tracking-[-0.02em] text-slate-900">
              이용 안내
            </h2>
            <div className="rounded-[16px] bg-slate-50 px-5 py-5">
              <ul className="space-y-2 text-[15px] font-medium text-slate-600 md:text-[16px]">
                <li>
                  • 운영시간은 {formatTime(parkingLot.operationStartTime)} ~{" "}
                  {formatTime(parkingLot.operationEndTime)} 입니다.
                </li>
                <li>• 기본 요금은 {formatPrice(parkingLot.price)} (10분당) 입니다.</li>
                <li>
                  • 총 주차 가능 면수는 {parkingLot.totalSpot.toLocaleString()}면입니다.
                </li>
                <li>• 본인의 차량 종류와 일치하는 구역만 예약 가능합니다.</li>
                <li>• 방문 전 최신 운영 여부와 현장 상황을 다시 확인해주세요.</li>
              </ul>
            </div>
          </section>

          {/* 위치 */}
          <section className="mt-8">
            <h2 className="mb-4 text-[22px] font-extrabold tracking-[-0.02em] text-slate-900">
              위치
            </h2>
            <div className="rounded-[18px] border border-slate-200 bg-[#f8fbff] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#2563eb] text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-slate-900">{parkingLot.name}</p>
                  <p className="text-[14px] text-slate-500">주소 정보</p>
                </div>
              </div>
              <div className="rounded-[14px] border border-slate-200 bg-white px-5 py-4">
                <p className="mb-1 text-[14px] font-semibold text-slate-500">도로명/지번 주소</p>
                <p className="text-[18px] font-bold text-slate-900">{parkingLot.address}</p>
              </div>
            </div>
          </section>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="mt-10 border-t border-slate-200 bg-[#f3f6fb]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="mb-2 text-[18px] font-bold text-slate-900">주차장 조회 서비스</h3>
            <p className="text-[15px] text-slate-500">강남구 공영주차장 정보를 제공합니다.</p>
          </div>
          <div className="text-left md:text-right">
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[15px] font-semibold text-slate-800 md:justify-end md:gap-6">
              <span>이용약관</span>
              <span>개인정보처리방침</span>
              <span>문의하기</span>
            </div>
            <p className="text-[15px] text-slate-500">© 2024 Parking Info. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}