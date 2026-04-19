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
  reservationApi,
  type ParkingLot,
  type ParkingSpot,
  toBackendDateTime,
  SPOT_TYPE_LABELS,
} from "@/lib/api";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock3,
  Loader2,
  AlertCircle,
  Check,
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

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchParkingLot = useCallback(async () => {
    if (!user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await parkingLotApi.getDetail(user.accessToken, parkingLotId);
      setParkingLot(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주차장 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [parkingLotId, user]);

  const fetchSpots = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const res = await parkingLotApi.getAllSpots(user.accessToken, parkingLotId);
      setSpots(res.data);
    } catch {
      setSpots([]);
    }
  }, [parkingLotId, user]);

  useEffect(() => {
    if (!authLoading && user?.accessToken) fetchParkingLot();
  }, [fetchParkingLot, authLoading, user]);

  useEffect(() => {
    if (!authLoading && user?.accessToken && step === 1) fetchSpots();
  }, [step, fetchSpots, authLoading, user]);

  // SSE 구독 - step 1(자리 선택)에서만 연결, step 2로 가면 끊기
  useEffect(() => {
    if (!user?.accessToken || step !== 1) return;

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const eventSource = new EventSource(
      `${BASE_URL}/api/parking-spots/${parkingLotId}/subscribe`,
      { withCredentials: false }
    );

    eventSource.onmessage = (e) => {
      // 최초 연결 확인 이벤트는 무시
      if (e.data === "connected") return;

      try {
        const updatedSpot = JSON.parse(e.data);
        // 받은 자리 상태로 spots 배열 업데이트
        setSpots((prev) =>
          prev.map((s) => (s.id === updatedSpot.id ? { ...s, ...updatedSpot } : s))
        );
        // 내가 선택한 자리가 다른 사람에게 선점됐으면 선택 해제
        setSelectedSpot((prev) => {
          if (prev && prev.id === updatedSpot.id && updatedSpot.status !== "AVAILABLE") {
            return null;
          }
          return prev;
        });
      } catch (err) {
        console.error("SSE 데이터 파싱 실패:", err);
      }
    };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}, [parkingLotId, user, step]);

  const calculateTotalPrice = () => {
    if (!parkingLot || !startTime || !endTime) return 0;
    const mins = (endTime.getTime() - startTime.getTime()) / 60000;
    return Math.ceil(mins / 10) * parkingLot.price;
  };

  const handleGoToTimePicker = () => {
    if (!selectedSpot) return;
    setStep(2);
  };

  const handleBackToSpotSelect = () => {
    setStep(1);
    fetchSpots();
  };

  const handleReserveClick = () => {
    if (!selectedSpot || !startTime || !endTime || !parkingLot) return;
    setShowConfirmModal(true);
  };

  // 모달 확인 → 예약 API 호출 → confirm 페이지로 이동
  const handleConfirmReservation = async () => {
    if (!selectedSpot || !startTime || !endTime || !parkingLot || !user?.accessToken) return;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);

    try {
      const resRes = await reservationApi.create(user.accessToken, {
        parkingLotId,
        parkingSpotId: selectedSpot.id,
        startTime: toBackendDateTime(formatLocalISO(startTime)),
        endTime: toBackendDateTime(formatLocalISO(endTime)),
      });

      const reservationId = resRes.data.reservationId;

      sessionStorage.setItem(
        "pendingReservation",
        JSON.stringify({
          reservationId,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약에 실패했습니다.");
      setShowConfirmModal(true); // 에러 시 모달 다시 열기
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTimeDisplay = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

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

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 md:px-6">
        <div className="mb-6">
          <Link
            href={`/parking-lots/${parkingLotId}`}
            className="inline-flex items-center gap-2 text-[15px] font-medium text-[#2563eb]"
          >
            <ArrowLeft className="h-4 w-4" />
            주차장 정보로 돌아가기
          </Link>
        </div>

        {/* 주차장 요약 + 스텝 인디케이터 */}
        <div className="mb-6 rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
          <h1 className="mb-1 text-[22px] font-extrabold text-slate-900">
            {parkingLot.name}
          </h1>
          <div className="mb-4 flex flex-wrap gap-4 text-[14px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {formatTime(parkingLot.operationStartTime)} ~{" "}
              {formatTime(parkingLot.operationEndTime)}
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              총 {parkingLot.totalSpot}면
            </div>
            <div className="font-semibold text-[#2563eb]">
              {formatPrice(parkingLot.price)} / 10분
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${step >= 1 ? "bg-[#2563eb] text-white" : "bg-slate-200 text-slate-500"}`}>
                1
              </div>
              <span className={`text-[14px] font-semibold ${step === 1 ? "text-[#2563eb]" : "text-slate-400"}`}>
                자리 선택
              </span>
            </div>
            <div className="h-px w-8 bg-slate-300" />
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${step >= 2 ? "bg-[#2563eb] text-white" : "bg-slate-200 text-slate-500"}`}>
                2
              </div>
              <span className={`text-[14px] font-semibold ${step === 2 ? "text-[#2563eb]" : "text-slate-400"}`}>
                시간 선택
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: 자리 선택 */}
        {step === 1 && (
          <div className="rounded-[20px] bg-white px-5 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">주차 자리 선택</h2>
              {profile && (
                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[13px] font-semibold text-[#2563eb]">
                  내 차종:{" "}
                  {profile.vehicleType === "SMALL" ? "경차" : profile.vehicleType === "LARGE" ? "대형" : "전기차"}
                </span>
              )}
            </div>
            <p className="mb-5 text-[13px] text-slate-500">
              ※ 원하는 자리를 선택한 후 아래 버튼을 눌러 시간을 설정하세요.
            </p>
            {user && (
                  <ParkingSpotSelector
                    spots={spots}
                    selectedSpot={selectedSpot}
                    onSelect={setSelectedSpot}
                    accessToken={user.accessToken}
                    parkingLotId={parkingLotId}
                  />
                )}
          </div>
        )}

        {/* Step 2: 시간 선택 */}
        {step === 2 && (
          <div className="rounded-[20px] bg-white px-5 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">이용 시간 선택</h2>
              <button
                type="button"
                onClick={handleBackToSpotSelect}
                className="text-[14px] font-semibold text-slate-500 hover:text-slate-700"
              >
                ← 자리 변경
              </button>
            </div>
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

      {/* 하단 고정 바 */}
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
              onClick={handleGoToTimePicker}
              className="flex h-[52px] min-w-[160px] items-center justify-center rounded-[12px] bg-[#2563eb] px-6 text-[17px] font-bold text-white disabled:opacity-40"
            >
              시간 선택하기
            </button>
          ) : (
            <button
              type="button"
              disabled={!startTime || !endTime || submitting}
              onClick={handleReserveClick}
              className="flex h-[52px] min-w-[160px] items-center justify-center rounded-[12px] bg-[#2563eb] px-6 text-[17px] font-bold text-white disabled:opacity-40"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              예약하기
            </button>
          )}
        </div>
      </div>

      {/* 예약 확인 모달 */}
      {showConfirmModal && selectedSpot && startTime && endTime && parkingLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg border">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">예약 확인</h3>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="rounded-lg border bg-slate-50 p-4 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">자리</span>
                <span className="text-sm font-semibold text-slate-900">
                  {selectedSpot.number}번 ({SPOT_TYPE_LABELS[selectedSpot.type]} 구역)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">시작</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDateTimeDisplay(startTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">종료</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDateTimeDisplay(endTime)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">예상 금액</span>
                <span className="text-base font-extrabold text-[#2563eb]">
                  {calculateTotalPrice().toLocaleString()}원
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-6">위 내용으로 예약을 진행하시겠습니까?<br />
              <span className="text-amber-600 font-medium">※ 예약 확인 후 5분 이내로 결제를 완료해야 예약이 확정됩니다.</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirmModal(false); setError(null); }}
                disabled={submitting}
                className="flex-1 h-11 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReservation}
                disabled={submitting}
                className="flex-1 h-11 rounded-lg bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting ? "예약 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}