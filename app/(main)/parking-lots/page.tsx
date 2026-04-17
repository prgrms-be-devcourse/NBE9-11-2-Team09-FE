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

// 주차장 목록 API에서 내려주는 데이터 형태
type ParkingLot = {
  id: number;
  name: string;
  address: string;
  totalSpot: number;
  price: number;
  operationStartTime: string;
  operationEndTime: string;
};

// 한 페이지에 보여줄 카드 개수
const ITEMS_PER_PAGE = 4;

// 백엔드에서 "09:00:00" 형태로 내려온 시간을 "09:00"으로 가공
function formatTime(value?: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export default function ParkingLotsPage() {
  // ----------------------------
  // 1. 화면에 필요한 상태들
  // ----------------------------

  // 서버에서 받아온 전체 주차장 목록
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);

  // API 호출 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // inputValue:
  // 사용자가 입력창에 "지금 치고 있는 값"
  // searchKeyword:
  // 실제 검색 버튼 / 엔터를 눌러서 검색에 반영된 값
  // 둘을 분리해두면 입력 중일 때마다 바로 검색되지 않아서 흐름이 안정적임
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 현재 페이지 번호
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------
  // 2. 목록 조회 함수
  // ----------------------------
  // "검색어가 있으면 해당 동으로 조회" / "검색어가 없으면 전체 조회"만 처리
  const fetchParkingLots = async (keyword?: string) => {
    try {
      setLoading(true);
      setError(null);

      // 검색어가 있으면 ?dong=검색어
      // 검색어가 없으면 전체 목록 조회
      const query =
        keyword && keyword.trim()
          ? `?dong=${encodeURIComponent(keyword.trim())}`
          : "";

      const response = await fetch(
        `http://localhost:8080/api/parking-lots${query}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("주차장 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();

      // 우리 백엔드 응답이 RsData 형태라면 data.data에 실제 목록이 들어있음
      // 혹시 바로 배열이 오는 경우까지 방어적으로 처리
      const lots: ParkingLot[] = Array.isArray(data) ? data : data.data ?? [];

      setParkingLots(lots);
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
  const handleSearch = () => {
    // 검색 버튼을 누르거나 엔터를 쳤을 때
    // inputValue를 실제 검색어로 확정
    const keyword = inputValue.trim();

    setSearchKeyword(keyword);
    setCurrentPage(1);

    // 검색은 프론트에서 한 번 더 거르지 않고,
    // 백엔드에 keyword(dong)를 넘겨서 서버 기준으로만 처리한다.
    fetchParkingLots(keyword);
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
  // 예: 3페이지에 있다가 검색했는데 결과가 1페이지 분량만 있으면
  // 화면이 비어 보일 수 있어서 항상 1페이지로 초기화
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

            <div className="hidden lg:block">
              <div className="relative h-[170px] w-[430px]">
                <div className="absolute inset-x-0 bottom-3 flex items-end justify-center gap-3 opacity-20">
                  <div className="h-[70px] w-[30px] bg-slate-400" />
                  <div className="h-[95px] w-[36px] bg-slate-400" />
                  <div className="h-[58px] w-[28px] bg-slate-400" />
                  <div className="h-[110px] w-[42px] bg-slate-400" />
                  <div className="h-[82px] w-[34px] bg-slate-400" />
                  <div className="h-[125px] w-[48px] bg-slate-400" />
                </div>

                <div className="absolute bottom-[18px] left-[70px] h-[8px] w-[290px] rounded-full bg-[#c9d8f8]" />

                <div className="absolute bottom-[18px] right-[34px]">
                  <div className="absolute bottom-[18px] left-[18px] h-[80px] w-[14px] rounded bg-[#2563eb]" />
                  <div className="absolute bottom-[90px] left-0 flex h-[54px] w-[54px] items-center justify-center rounded-[12px] bg-[#2563eb] text-white shadow">
                    <span className="text-[32px] font-bold">P</span>
                  </div>
                </div>

                <div className="absolute bottom-[22px] left-[170px] h-[70px] w-[132px] rounded-[26px] bg-[#3b82f6] shadow-md">
                  <div className="absolute left-[16px] right-[16px] top-[16px] h-[12px] rounded-full bg-[#1e3a8a]" />
                  <div className="absolute bottom-[16px] left-[18px] h-[18px] w-[22px] rounded bg-white" />
                  <div className="absolute bottom-[16px] right-[18px] h-[18px] w-[22px] rounded bg-white" />
                </div>

                <div className="absolute bottom-[8px] left-[184px] h-[18px] w-[24px] rounded-full bg-slate-700" />
                <div className="absolute bottom-[8px] left-[266px] h-[18px] w-[24px] rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[20px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="OO동으로 입력해주세요."
                className="h-[56px] w-full rounded-[14px] border border-slate-200 bg-white pl-14 pr-4 text-[16px] outline-none placeholder:text-slate-400 focus:border-[#2563eb]"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="flex h-[56px] items-center justify-center rounded-[14px] bg-[#2563eb] px-9 text-[18px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Search className="mr-2 h-5 w-5" />
              검색
            </button>
          </div>
        </section>

        <section className="mt-5">
          <p className="text-[18px] font-semibold text-slate-900">
            총 <span className="text-[#2563eb]">{parkingLots.length}</span>개의
            주차장이 있습니다.
          </p>
        </section>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            주차장 목록을 불러오는 중...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center text-red-500 shadow-sm">
            {error}
          </div>
        ) : parkingLots.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <section className="mt-5 space-y-4">
              {pagedLots.map((lot) => {
                return (
                  <article
                    key={lot.id}
                    className="rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)] md:px-8 md:py-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-5">
                        <div className="flex h-[96px] w-[96px] shrink-0 flex-col items-center justify-center rounded-[16px] bg-[#eef4ff] md:h-[110px] md:w-[110px]">
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#2563eb] text-white">
                            <span className="text-[26px] font-bold">P</span>
                          </div>
                          <Car className="h-8 w-8 text-slate-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="mb-2 truncate text-[22px] font-bold text-slate-900 md:text-[24px]">
                            {lot.name}
                          </h2>

                          <div className="mb-3 inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-[14px] font-semibold text-[#2563eb]">
                            공영주차장
                          </div>

                          <div className="mb-4 flex items-center gap-2 text-[15px] text-slate-600 md:text-[16px]">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{lot.address}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] text-slate-700 md:text-[16px]">
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-5 w-5 text-slate-500" />
                              <span>
                                운영시간 {formatTime(lot.operationStartTime)} ~{" "}
                                {formatTime(lot.operationEndTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[18px]">₩</span>
                              <span>요금 {lot.price}원</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Car className="h-5 w-5 text-slate-500" />
                              <span>총 {lot.totalSpot}면</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-[320px] xl:flex-col xl:justify-end">
                        {/* 
                          상세보기는 주차장 id 기준으로 이동해야 하므로 Link 사용
                        */}
                        <Link
                          href={`/parking-lots/${lot.id}`}
                          className="flex h-[46px] flex-1 items-center justify-center rounded-[10px] border border-[#8fb2ff] bg-white text-[16px] font-semibold text-[#4f7ef7] md:text-[18px]"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          상세보기
                        </Link>

                        <button
                          type="button"
                          className="flex h-[46px] flex-1 items-center justify-center rounded-[10px] bg-[#2563eb] text-[16px] font-semibold text-white md:text-[18px]"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          예약하기
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {visiblePages.map((page) => {
                const active = page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 rounded-[10px] text-[18px] font-semibold ${
                      active
                        ? "bg-[#2563eb] text-white"
                        : "bg-transparent text-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </section>
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-[#f3f6fb]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="mb-2 text-[18px] font-bold text-slate-900">
              주차장 조회 서비스
            </h3>
            <p className="text-[15px] text-slate-500">
              강남구 공영주차장 정보를 제공합니다.
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[15px] font-semibold text-slate-800 md:justify-end md:gap-6">
              <span>이용약관</span>
              <span>개인정보처리방침</span>
              <span>문의하기</span>
            </div>
            <p className="text-[15px] text-slate-500">
              © 2024 Parking Info. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}