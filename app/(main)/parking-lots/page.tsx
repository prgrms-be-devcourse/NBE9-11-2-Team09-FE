"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { ParkingLot, parkingLotApi } from "@/lib/api";
import { ParkingLotCard } from "@/components/parking/parking-lot-card";
import { SearchFilters, type FilterOptions } from "@/components/parking/search-filters";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 한 페이지에 보여줄 카드 개수
const ITEMS_PER_PAGE = 6;

export default function ParkingLotsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);

  // API 호출 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({ sortBy: "name", hasAvailable: false });

  // ─── 목록 조회 ───────────────────────────────────────────
  const fetchParkingLots = async (dong?: string) => {
    if (!user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await parkingLotApi.getList(user.accessToken, dong);
      const lots = response.data;
      setParkingLots(lots);
      applySort(lots, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주차장 목록을 불러오지 못했습니다.");
      setParkingLots([]);
      setFilteredLots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.accessToken) fetchParkingLots();
  }, [authLoading, user]);

  // ─── 정렬 적용 ───────────────────────────────────────────
  const applySort = (lots: ParkingLot[], f: FilterOptions) => {
    let sorted = [...lots];
    if (f.sortBy === "price") {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
    setFilteredLots(sorted);
    setCurrentPage(1);
  };

  // ─── 검색 핸들러 (SearchFilters → 프론트 필터) ──────────
  const handleSearch = (query: string) => {
    if (!query) {
      applySort(parkingLots, filters);
      return;
    }
    const matched = parkingLots.filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.address.toLowerCase().includes(query.toLowerCase())
    );
    applySort(matched, filters);
  };

  // ─── 필터 변경 ───────────────────────────────────────────
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applySort(filteredLots, newFilters);
  };

  // ─── 페이지네이션 ────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredLots.length / ITEMS_PER_PAGE));

  const pagedLots = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLots.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLots, currentPage]);

  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // ─── 렌더링 ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 pb-14 md:px-6">

        {/* ── 히어로 배너 (dev) ── */}
        <section className="overflow-hidden bg-[#eaf1ff]">
          <div className="flex min-h-[220px] items-center justify-between px-6 py-10 md:px-10">
            <div>
              <h1 className="mb-3 text-[38px] font-extrabold leading-none tracking-[-0.03em] md:text-[56px]">
                <span className="text-[#2563eb]">강남구</span>{" "}
                <span className="text-slate-900">공영주차장</span>
              </h1>
              <p className="mb-6 text-[16px] font-medium text-slate-600 md:text-[18px]">
                강남구 내 공영주차장을 검색하고 정보를 확인하세요.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-slate-700">
                  전체{" "}
                  <span className="ml-1 text-[18px] text-[#2563eb]">
                    {parkingLots.length}
                  </span>
                  개
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-[#2563eb]" />
                  조회 기준: <span className="text-[#2563eb]">강남구</span>
                </div>
              </div>
            </div>

            {/* 데코 일러스트 */}
            <div className="hidden lg:block">
              <div className="flex items-end gap-10">
                {/* 자동차 */}
                <div className="relative h-[90px] w-[160px]">
                  <div className="absolute bottom-0 left-[20px] h-[24px] w-[20px] rounded-md bg-slate-800" />
                  <div className="absolute bottom-0 right-[20px] h-[24px] w-[20px] rounded-md bg-slate-800" />
                  <div className="absolute bottom-[45px] left-[30px] h-[35px] w-[100px] rounded-t-2xl bg-[#2563eb]" />
                  <div className="absolute bottom-[45px] left-[38px] h-[25px] w-[84px] rounded-t-xl bg-slate-200" />
                  <div className="absolute bottom-[40px] left-[18px] h-[12px] w-[12px] rounded-l-md bg-[#2563eb]" />
                  <div className="absolute bottom-[40px] right-[18px] h-[12px] w-[12px] rounded-r-md bg-[#2563eb]" />
                  <div className="absolute bottom-[10px] left-0 h-[45px] w-[160px] rounded-xl bg-[#2563eb] shadow-md" />
                  <div className="absolute bottom-[25px] left-[50px] h-[14px] w-[60px] rounded-sm bg-slate-800" />
                  <div className="absolute bottom-[30px] left-[16px] h-[14px] w-[14px] rounded-full bg-[#FFFBFA]" />
                  <div className="absolute bottom-[30px] right-[16px] h-[14px] w-[14px] rounded-full bg-[#FFFBFA]" />
                  <div className="absolute bottom-[14px] left-[65px] h-[8px] w-[30px] rounded-sm bg-white" />
                </div>

                {/* P 표지판 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[12px] bg-[#2563eb] text-white shadow">
                    <span className="text-[32px] font-bold">P</span>
                  </div>
                  <div className="h-[100px] w-[14px] rounded bg-[#2563eb]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 검색/필터 (cus03-04 SearchFilters) ── */}
        <section className="mt-5 rounded-[20px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-7">
          <SearchFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </section>

        {/* ── 결과 수 + 새로고침 ── */}
        <section className="mt-5 flex items-center justify-between">
          <p className="text-[18px] font-semibold text-slate-900">
            총{" "}
            <span className="text-[#2563eb]">{filteredLots.length}</span>개의
            주차장
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchParkingLots()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </section>

        {/* ── 상태별 렌더링 ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#2563eb]" />
            <p className="text-slate-500">주차장을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-[20px] bg-white py-16 shadow-sm">
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 font-medium text-red-500">{error}</p>
            <Button onClick={() => fetchParkingLots()}>다시 시도</Button>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            {/* ── 카드 그리드 (cus03-04 ParkingLotCard) ── */}
            <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pagedLots.map((lot) => (
                <ParkingLotCard key={lot.id} parkingLot={lot} />
              ))}
            </section>

            {/* ── 페이지네이션 (dev) ── */}
            <section className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-[10px] text-[18px] font-semibold ${
                    page === currentPage
                      ? "bg-[#2563eb] text-white"
                      : "bg-transparent text-slate-800"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </section>
          </>
        )}
      </main>

      {/* ── 푸터 (dev) ── */}
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