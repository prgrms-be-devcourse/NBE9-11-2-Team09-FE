"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Search,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { ParkingLot, parkingLotApi } from "@/lib/api";
import { ParkingLotCard } from "@/components/parking/parking-lot-card";

// 한 페이지에 보여줄 카드 개수
const ITEMS_PER_PAGE = 4;

export default function ParkingLotsPage() {
  // ----------------------------
  // 1. 화면에 필요한 상태들
  // ----------------------------

  // 서버에서 받아온 전체 주차장 목록 (데이터)
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);

  // API 호출 상태 (로딩, 에러 여부)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // inputValue: 사용자가 입력창에 "지금 치고 있는 값"
  // searchKeyword: 실제 검색 버튼 / 엔터를 눌러서 검색에 반영된 값
  // 둘을 분리해두면 입력 중일 때마다 바로 검색되지 않아서 흐름이 안정적임
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------
  // 2. 목록 조회 함수
  // ----------------------------
  // 검색어가 있으면 해당 동으로 조회 / 검색어가 없으면 전체 조회만 처리
  const fetchParkingLots = async (keyword?: string) => {
    try {
      setLoading(true); // 로딩 시작
      setError(null); // 이전 에러 초기화
      
      const cleanedKeyword = keyword?.trim() || undefined; // 검색어 정리 (공백 제거 후 값이 없으면 undefined로 처리)

      const response = await parkingLotApi.getList(cleanedKeyword); // API 호출

      setParkingLots(response.data); // 실제 데이터 추출

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "주차장 목록 조회에 실패했습니다."
      );
      setParkingLots([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // 3. 최초 진입 시 전체 목록 조회
  // ----------------------------
  useEffect(() => {
    fetchParkingLots();
  }, []);

  // ----------------------------
  // 4. 검색 실행
  // ----------------------------
  const handleSearch = () => { // 검색 버튼 클릭 또는 Enter 입력 시 실행되는 함수
    // 사용자가 입력창에 적은 값을 공백 제거 후 검색어로 사용
    const keyword = inputValue.trim(); // 입력창 값 정리

    // 실제 검색 기준이 되는 상태값 저장
    setSearchKeyword(keyword); // 검색어 상태 업데이트
    setCurrentPage(1); // 검색 후 첫 페이지로 이동
    fetchParkingLots(keyword); // 실제 검색 요청
  };

  // ----------------------------
  // 5. 페이지네이션 계산
  // ----------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(parkingLots.length / ITEMS_PER_PAGE)
  );

  // 현재 페이지에 보여줄 목록만 잘라서 사용
  const pagedLots = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return parkingLots.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [parkingLots, currentPage]);

  // 검색어가 바뀌면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  // 페이지네이션에 노출할 페이지 번호 목록
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 pb-14 md:px-6">
        {/* 히어로 섹션 */}
        <section className="overflow-hidden bg-[#eaf1ff]">
          <div className="flex min-h-[220px] items-center justify-between px-6 py-10 md:px-10">
            <div>
              <h1 className="mb-3 text-[38px] font-extrabold leading-none tracking-[-0.03em] md:text-[56px]">
                <span className="text-[#2563eb]">강남구</span> <span className="text-slate-900">공영주차장</span>
              </h1>
              <p className="mb-6 text-[16px] font-medium text-slate-600 md:text-[18px]">
                강남구 내 공영주차장을 검색하고 정보를 확인하세요.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-slate-700">
                  전체 <span className="ml-1 text-[18px] text-[#2563eb]">{parkingLots.length}</span>개
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-[#2563eb]" />
                  조회 기준: <span className="text-[#2563eb]">강남구</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 검색 섹션 */}
        <section className="mt-5 rounded-[20px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="OO동으로 입력해주세요."
                className="h-[56px] w-full rounded-[14px] border border-slate-200 bg-white pl-14 pr-4 text-[16px] outline-none placeholder:text-slate-400 focus:border-[#2563eb]"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex h-[56px] items-center justify-center rounded-[14px] bg-[#2563eb] px-9 text-[18px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Search className="mr-2 h-5 w-5" /> 검색
            </button>
          </div>
        </section>

        <section className="mt-5">
          <p className="text-[18px] font-semibold text-slate-900">
            총 <span className="text-[#2563eb]">{parkingLots.length}</span>개의 주차장이 있습니다.
          </p>
        </section>

        {/* 리스트 섹션 */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">주차장 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center text-red-500 shadow-sm">{error}</div>
        ) : parkingLots.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center text-slate-500 shadow-sm">검색 결과가 없습니다.</div>
        ) : (
          <>
            <section className="mt-5 space-y-4">
              {pagedLots.map((lot) => (
                <ParkingLotCard key={lot.id} parkingLot={lot} />
              ))}
            </section>

            {/* 페이지네이션 */}
            <section className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-[10px] text-[18px] font-semibold ${
                    page === currentPage ? "bg-[#2563eb] text-white" : "bg-transparent text-slate-800"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}