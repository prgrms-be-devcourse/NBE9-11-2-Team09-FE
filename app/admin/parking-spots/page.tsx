"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  parkingLotApi,
  adminParkingSpotApi,
  type ParkingLot,
  type ParkingSpot,
  type SpotStatus,
} from "@/lib/api";
import { Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<SpotStatus, string> = {
  AVAILABLE: "사용 가능",
  OCCUPIED: "예약됨",
  PARKED: "주차 중",
  PAYING: "정산 중",
};

const STATUS_STYLE: Record<SpotStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-blue-100 text-blue-700",
  PARKED: "bg-orange-100 text-orange-700",
  PAYING: "bg-yellow-100 text-yellow-700",
};

const ALL_STATUSES: SpotStatus[] = ["AVAILABLE", "OCCUPIED", "PARKED", "PAYING"];

export default function AdminParkingSpotsPage() {
  const { user } = useAuth();

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);

  // 상태 변경 중인 자리 id → 선택된 status 값
  const [pendingStatus, setPendingStatus] = useState<Record<number, SpotStatus>>({});
  // 저장 요청 중인 자리 id
  const [savingId, setSavingId] = useState<number | null>(null);
  // 성공 피드백
  const [successId, setSuccessId] = useState<number | null>(null);

  // 주차장 목록 불러오기
  useEffect(() => {
    if (!user?.accessToken) return;
    setLoadingLots(true);
    parkingLotApi
      .getList(user.accessToken)
      .then((res) => setLots(res.data ?? []))
      .catch(() => setLots([]))
      .finally(() => setLoadingLots(false));
  }, [user]);

  // 주차장 선택 시 자리 목록 불러오기
  const handleSelectLot = async (lot: ParkingLot) => {
    if (!user?.accessToken) return;
    setSelectedLot(lot);
    setPendingStatus({});
    setLoadingSpots(true);
    try {
      const res = await parkingLotApi.getAllSpots(user.accessToken, lot.id);
      setSpots(res.data ?? []);
    } catch {
      setSpots([]);
    } finally {
      setLoadingSpots(false);
    }
  };

  // 상태 변경 저장
  const handleSave = async (spot: ParkingSpot) => {
    if (!user?.accessToken) return;
    const newStatus = pendingStatus[spot.id];
    if (!newStatus || newStatus === spot.status) return;

    setSavingId(spot.id);
    try {
      await adminParkingSpotApi.updateStatus(user.accessToken, spot.id, newStatus);
      // 로컬 상태 업데이트
      setSpots((prev) =>
        prev.map((s) => (s.id === spot.id ? { ...s, status: newStatus } : s))
      );
      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[spot.id];
        return next;
      });
      setSuccessId(spot.id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err: any) {
      alert(err.message || "상태 변경에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">주차 자리 관리</h1>

      <div className="flex gap-6">
        {/* 주차장 목록 */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">주차장 선택</p>
            </div>
            {loadingLots ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[#2563eb]" />
              </div>
            ) : lots.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">주차장이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {lots.map((lot) => (
                  <li key={lot.id}>
                    <button
                      onClick={() => handleSelectLot(lot)}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-colors",
                        selectedLot?.id === lot.id
                          ? "bg-[#2563eb] text-white font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <p className="font-medium">{lot.name}</p>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          selectedLot?.id === lot.id ? "text-blue-100" : "text-slate-400"
                        )}
                      >
                        {lot.address}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 자리 목록 */}
        <div className="flex-1">
          {!selectedLot ? (
            <div className="bg-white rounded-xl shadow-sm flex items-center justify-center py-24">
              <p className="text-slate-400 text-sm">왼쪽에서 주차장을 선택하세요.</p>
            </div>
          ) : loadingSpots ? (
            <div className="bg-white rounded-xl shadow-sm flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
            </div>
          ) : spots.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm flex items-center justify-center py-24">
              <p className="text-slate-400 text-sm">등록된 자리가 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-slate-800">
                  {selectedLot.name} — 자리 목록
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    총 {spots.length}개
                  </span>
                </p>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["자리 번호", "타입", "현재 상태", "변경할 상태", "적용"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {spots.map((spot) => {
                    const selected = pendingStatus[spot.id] ?? spot.status;
                    const isDirty = pendingStatus[spot.id] && pendingStatus[spot.id] !== spot.status;
                    const isSaving = savingId === spot.id;
                    const isSuccess = successId === spot.id;

                    return (
                      <tr key={spot.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {spot.number}번
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {spot.type === "SMALL"
                            ? "경차"
                            : spot.type === "LARGE"
                            ? "대형"
                            : "전기차"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              STATUS_STYLE[spot.status]
                            )}
                          >
                            {STATUS_LABELS[spot.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="relative inline-block">
                            <select
                              value={selected}
                              onChange={(e) =>
                                setPendingStatus((prev) => ({
                                  ...prev,
                                  [spot.id]: e.target.value as SpotStatus,
                                }))
                              }
                              className={cn(
                                "appearance-none pr-8 pl-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb]",
                                isDirty
                                  ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                                  : "border-slate-200 bg-white text-slate-700"
                              )}
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {isSuccess ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              변경 완료
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSave(spot)}
                              disabled={!isDirty || isSaving}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
                                isDirty
                                  ? "bg-[#2563eb] text-white hover:bg-blue-700"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              )}
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "적용"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
