"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { ParkingSpotSelector } from "@/components/parking/parking-spot-selector";
import { TimePicker } from "@/components/parking/time-picker";
import { Button } from "@/components/ui/button";
import {
  parkingLotApi,
  type ParkingLot,
  type ParkingSpot,
  toBackendDateTime,
} from "@/lib/api";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock3,
  Loader2,
  AlertCircle,
} from "lucide-react";

function formatTime(value?: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}
function formatPrice(value?: number) {
  if (value === undefined || value === null) return "-";
  return `${value.toLocaleString()}원`;
}

type Step = 1 | 2;

export default function ParkingLotReservePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const parkingLotId = Number(params?.id);

  // ─── 상태 ────────────────────────────────────────────────
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  // ─── 주차장 기본 정보 조회 ────────────────────────────────
  const fetchParkingLot = useCallback(async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await parkingLotApi.getDetail(user.accessToken, parkingLotId);
      setParkingLot(res.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "주차장 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [parkingLotId, user]);

  // ─── 가용 자리 조회 ───────────────────────────────────────
  const fetchSpots = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const res = await parkingLotApi.getAvailableSpots(
        user.accessToken,
        parkingLotId
      );
      setSpots(res.data);
    } catch {
      setSpots([]);
    }
  }, [parkingLotId, user]);

  useEffect(() => {
    if (!authLoading && user?.accessToken) fetchParkingLot();
  }, [fetchParkingLot, authLoading, user]);

  // step 1일 때만 자리 조회 (시간 선택 단계에서 불필요한 재조회 방지)
  useEffect(() => {
    if (!authLoading && user?.accessToken && step === 1) fetchSpots();
  }, [step, fetchSpots, authLoading, user]);

  // ─── 예상 금액 계산 ───────────────────────────────────────
  const calculateTotalPrice = () => {
    if (!parkingLot || !startTime || !endTime) return 0;
    const mins = (endTime.getTime() - startTime.getTime()) / 60000;
    return Math.ceil(mins / 10) * parkingLot.price;
  };

  // ─── 예약 확인 페이지로 이동 ──────────────────────────────
  const handleProceedToReservation = () => {
    if (!selectedSpot || !startTime || !endTime || !parkingLot) return;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    sessionStorage.setItem(
      "pendingReservation",
      JSON.stringify({
        parkingLotId,
        parkingLotName: parkingLot.name,
        spotId: selectedSpot.id,
        spotNumber: selectedSpot.number,
        startTime: toBackendDateTime(formatLocalISO(startTime)),
        endTime: toBackendDateTime(formatLocalISO(endTime)),
        totalPrice: calculateTotalPrice(),
      })
    );
    router.push("/reservation/confirm");
  };

  // ─── 로딩 ────────────────────────────────────────────────
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

  // ─── 에러 ────────────────────────────────────────────────
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

  // ─── 메인 렌더 ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 md:px-6">

        {/* 뒤로가기 → 상세 정보 페이지 */}
        <div className="mb-6">
          <Link
            href={`/parking-lots/${parkingLotId}`}
            className="inline-flex items-center gap-2 text-[15px] font-medium text-[#2563eb]"
          >
            <ArrowLeft className="h-4 w-4" />
            주차장 정보로 돌아가기
          </Link>
        </div>

        {/* 주차장 요약 정보 헤더 */}
        <div className="mb-6 rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
          <h1 className="mb-1 text-[22px] font-extrabold text-slate-900">
            {parkingLot.name}
          </h1>
          <div className="mb-4 flex flex-wrap gap-4 text-[14px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {formatTime(parkingLot.operationStartTime)} ~ {formatTime(parkingLot.operationEndTime)}
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              총 {parkingLot.totalSpot}면
            </div>
            <div className="font-semibold text-[#2563eb]">
              {formatPrice(parkingLot.price)} / 10분
            </div>
          </div>

          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                  step >= 1
                    ? "bg-[#2563eb] text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                1
              </div>
              <span
                className={`text-[14px] font-semibold ${
                  step === 1 ? "text-[#2563eb]" : "text-slate-400"
                }`}
              >
                자리 선택
              </span>
            </div>
            <div className="h-px w-8 bg-slate-300" />
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                  step >= 2
                    ? "bg-[#2563eb] text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                2
              </div>
              <span
                className={`text-[14px] font-semibold ${
                  step === 2 ? "text-[#2563eb]" : "text-slate-400"
                }`}
              >
                시간 선택
              </span>
            </div>
          </div>
        </div>

        {/* ── Step 1: 자리 선택 ── */}
        {step === 1 && (
          <div className="rounded-[20px] bg-white px-5 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">주차 자리 선택</h2>
              {profile && (
                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[13px] font-semibold text-[#2563eb]">
                  내 차종:{" "}
                  {profile.vehicleType === "SMALL"
                    ? "경차"
                    : profile.vehicleType === "LARGE"
                    ? "대형"
                    : "전기차"}
                </span>
              )}
            </div>
            <p className="mb-5 text-[13px] text-slate-500">
              ※ 본인의 차량 종류와 일치하는 구역만 예약 가능합니다.
            </p>

            <ParkingSpotSelector
              spots={spots.filter(
                (s) => !profile || s.type === profile.vehicleType
              )}
              selectedSpot={selectedSpot}
              onSelect={setSelectedSpot}
              accessToken={user?.accessToken ?? ""}
              parkingLotId={parkingLotId}
            />
          </div>
        )}

        {/* ── Step 2: 시간 선택 ── */}
        {step === 2 && (
          <div className="rounded-[20px] bg-white px-5 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">이용 시간 선택</h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[14px] font-semibold text-slate-500 hover:text-slate-700"
              >
                ← 자리 변경
              </button>
            </div>

            {/* 선택된 자리 확인 칩 */}
            {selectedSpot && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-[14px] font-semibold text-[#2563eb]">
                <Car className="h-4 w-4" />
                {selectedSpot.number}번 자리 선택됨
              </div>
            )}

            <TimePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>
        )}
      </main>

      {/* ── 하단 고정 바 ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-slate-500">예상 결제 금액</p>
            <p className="text-[26px] font-extrabold text-slate-900">
              {calculateTotalPrice().toLocaleString()}원
            </p>
          </div>

          {step === 1 ? (
            <button
              type="button"
              disabled={!selectedSpot}
              onClick={() => setStep(2)}
              className="flex h-[52px] min-w-[160px] items-center justify-center rounded-[12px] bg-[#2563eb] px-6 text-[17px] font-bold text-white disabled:opacity-40"
            >
              시간 선택하기
            </button>
          ) : (
            <button
              type="button"
              disabled={!startTime || !endTime}
              onClick={handleProceedToReservation}
              className="flex h-[52px] min-w-[160px] items-center justify-center rounded-[12px] bg-[#2563eb] px-6 text-[17px] font-bold text-white disabled:opacity-40"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              예약하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}