"use client";

// ----------------------------
// 1. React / Next 기본 import
// ----------------------------
// useEffect: 처음 화면이 뜰 때 상세 조회 API 호출
// useState: 상세 데이터, 로딩, 에러 상태 관리
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ----------------------------
// 2. 아이콘 import
// ----------------------------
// 화면에서 정보 성격을 직관적으로 보여주기 위한 아이콘들
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Clock3,
  MapPin,
  Wallet,
} from "lucide-react";

import { Header } from "@/components/layout/header";

// ----------------------------
// 3. 상세 조회 응답 타입
// ----------------------------
// 백엔드 ParkingLotResDto와 맞춰둔 프론트 타입
// LocalTime은 JSON으로 오면서 string 형태로 내려오므로 string으로 받는다.
type ParkingLotDetail = {
  id: number;
  name: string;
  address: string;
  totalSpot: number;
  price: number;
  operationStartTime: string;
  operationEndTime: string;
};

// ----------------------------
// 4. 공통 포맷 함수
// ----------------------------
// "09:00:00" → "09:00"
function formatTime(value?: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}

// 1000 → "1,000원"
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
  const id = params?.id as string;

  // ----------------------------
  // 6. 상태 관리
  // ----------------------------
  // parkingLot: 서버에서 받아온 상세 데이터
  // loading: API 요청 진행 여부
  // error: 요청 실패 시 보여줄 메시지
  const [parkingLot, setParkingLot] = useState<ParkingLotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------
  // 7. 상세 조회 API 호출 함수
  // ----------------------------
  const fetchParkingLot = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/parking-lots/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // 상세 정보는 최신 값이 중요하므로 캐시 없이 조회
          cache: "no-store",
        }
      );

      // 200번대 응답이 아니면 에러 처리
      if (!response.ok) {
        throw new Error("주차장 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();

      // 응답 구조 방어 처리
      // 1) 배열이면 첫 번째 요소 사용
      // 2) RsData 구조면 data.data 사용
      // 3) 그 외에는 data 자체 사용
      const lot: ParkingLotDetail =
        Array.isArray(data) ? data[0] : data.data ?? data;

      setParkingLot(lot);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "주차장 상세 정보를 불러오는 중 오류가 발생했습니다."
      );
      setParkingLot(null);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // 8. 화면 최초 진입 / id 변경 시 상세 조회 실행
  // ----------------------------
  useEffect(() => {
    if (!id) return;
    fetchParkingLot();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <Header />

      <main className="mx-auto max-w-[1280px] px-4 pb-14 md:px-6">
        {/* ----------------------------
            목록으로 돌아가기 링크
        ---------------------------- */}
        <section className="py-6">
          <Link
            href="/parking-lots"
            className="inline-flex items-center gap-2 text-[16px] font-medium text-[#2563eb]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </section>

        {/* ----------------------------
            상태별 렌더링
            1) loading
            2) error
            3) 데이터 없음
            4) 정상 데이터 표시
        ---------------------------- */}
        {loading ? (
          <div className="rounded-[24px] bg-white px-6 py-20 text-center text-slate-500 shadow-sm">
            주차장 상세 정보를 불러오는 중...
          </div>
        ) : error ? (
          <div className="rounded-[24px] bg-white px-6 py-20 text-center text-red-500 shadow-sm">
            {error}
          </div>
        ) : !parkingLot ? (
          <div className="rounded-[24px] bg-white px-6 py-20 text-center text-slate-500 shadow-sm">
            주차장 정보가 없습니다.
          </div>
        ) : (
          <>
            {/* ----------------------------
                상단 제목 영역
                - 주차장명
                - 배지
                - 주소
                - 예약 버튼
            ---------------------------- */}
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

                <p className="text-[18px] text-slate-600 md:text-[20px]">
                  {parkingLot.address}
                </p>
              </div>

              {/* 예약 기능 연결 전이더라도 버튼 위치/디자인은 먼저 잡아둔 상태 */}
              <button
                type="button"
                className="flex h-[56px] w-full items-center justify-center rounded-[12px] bg-[#2563eb] px-8 text-[18px] font-bold text-white lg:w-[220px]"
              >
                <CalendarDays className="mr-3 h-5 w-5" />
                예약하기
              </button>
            </section>

            <section className="rounded-[24px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:px-8 md:py-8">
              {/* ----------------------------
                  요약 카드 영역
                  사용자가 먼저 확인할 핵심 정보 3개를 카드로 강조
                  - 운영 시간
                  - 요금
                  - 총 주차면수
              ---------------------------- */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[18px] border border-[#e4eefc] bg-[#f8fbff] px-6 py-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff]">
                      <Clock3 className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <span className="text-[16px] font-bold text-slate-700">
                      운영 시간
                    </span>
                  </div>

                  <p className="text-[28px] font-extrabold text-slate-900">
                    {formatTime(parkingLot.operationStartTime)} ~{" "}
                    {formatTime(parkingLot.operationEndTime)}
                  </p>

                  <p className="mt-2 text-[15px] font-medium text-slate-500">
                    운영시간 기준 정보
                  </p>
                </div>

                <div className="rounded-[18px] border border-[#e4eefc] bg-[#f8fbff] px-6 py-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff]">
                      <Wallet className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <span className="text-[16px] font-bold text-slate-700">
                      요금
                    </span>
                  </div>

                  <p className="text-[28px] font-extrabold text-slate-900">
                    {formatPrice(parkingLot.price)}
                  </p>

                  <p className="mt-2 text-[15px] font-medium text-slate-500">
                    요금 정보
                  </p>
                </div>

                <div className="rounded-[18px] border border-[#e4eefc] bg-[#f8fbff] px-6 py-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf1ff]">
                      <Car className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <span className="text-[16px] font-bold text-slate-700">
                      총 주차면수
                    </span>
                  </div>

                  <p className="text-[28px] font-extrabold text-slate-900">
                    {parkingLot.totalSpot.toLocaleString()}면
                  </p>

                  <p className="mt-2 text-[15px] font-medium text-slate-500">
                    전체 주차 가능 구획 수
                  </p>
                </div>
              </div>

              {/* ----------------------------
                  기본 정보 영역
                  표 형태로 상세 정보 재정리
              ---------------------------- */}
              <section className="mt-8">
                <h2 className="mb-4 text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
                  기본 정보
                </h2>

                <div className="overflow-hidden rounded-[12px] border border-slate-200">
                  <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 md:grid-cols-[180px_1fr]">
                    <div className="bg-slate-50 px-4 py-4 text-[16px] font-bold text-slate-600 md:px-5 md:text-[18px]">
                      주차장명
                    </div>
                    <div className="px-4 py-4 text-[16px] font-semibold text-slate-800 md:px-5 md:text-[18px]">
                      {parkingLot.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 md:grid-cols-[180px_1fr]">
                    <div className="bg-slate-50 px-4 py-4 text-[16px] font-bold text-slate-600 md:px-5 md:text-[18px]">
                      주소
                    </div>
                    <div className="px-4 py-4 text-[16px] font-semibold text-slate-800 md:px-5 md:text-[18px]">
                      {parkingLot.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 md:grid-cols-[180px_1fr]">
                    <div className="bg-slate-50 px-4 py-4 text-[16px] font-bold text-slate-600 md:px-5 md:text-[18px]">
                      운영시간
                    </div>
                    <div className="px-4 py-4 text-[16px] font-semibold text-slate-800 md:px-5 md:text-[18px]">
                      {formatTime(parkingLot.operationStartTime)} ~{" "}
                      {formatTime(parkingLot.operationEndTime)}
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] border-b border-slate-200 md:grid-cols-[180px_1fr]">
                    <div className="bg-slate-50 px-4 py-4 text-[16px] font-bold text-slate-600 md:px-5 md:text-[18px]">
                      요금
                    </div>
                    <div className="px-4 py-4 text-[16px] font-semibold text-slate-800 md:px-5 md:text-[18px]">
                      {formatPrice(parkingLot.price)}
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr]">
                    <div className="bg-slate-50 px-4 py-4 text-[16px] font-bold text-slate-600 md:px-5 md:text-[18px]">
                      주차면수
                    </div>
                    <div className="px-4 py-4 text-[16px] font-semibold text-slate-800 md:px-5 md:text-[18px]">
                      총 {parkingLot.totalSpot.toLocaleString()}면
                    </div>
                  </div>
                </div>
              </section>

              {/* ----------------------------
                  이용 안내 영역
                  상세 데이터를 문장형으로 한 번 더 안내
              ---------------------------- */}
              <section className="mt-8">
                <h2 className="mb-4 text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
                  이용 안내
                </h2>

                <div className="rounded-[16px] bg-slate-50 px-5 py-5">
                  <ul className="space-y-2 text-[16px] font-medium text-slate-600 md:text-[18px]">
                    <li>
                      • 운영시간은 {formatTime(parkingLot.operationStartTime)} ~{" "}
                      {formatTime(parkingLot.operationEndTime)} 입니다.
                    </li>
                    <li>• 기본 요금은 {formatPrice(parkingLot.price)} 입니다.</li>
                    <li>
                      • 총 주차 가능 면수는{" "}
                      {parkingLot.totalSpot.toLocaleString()}면입니다.
                    </li>
                    <li>
                      • 방문 전 최신 운영 여부와 현장 상황을 다시 확인해주세요.
                    </li>
                  </ul>
                </div>
              </section>

              {/* ----------------------------
                  위치 정보 영역
                  지도 API 연동 전이라도 주소 정보는 먼저 제공
              ---------------------------- */}
              <section className="mt-8">
                <h2 className="mb-4 text-[26px] font-extrabold tracking-[-0.02em] text-slate-900">
                  위치
                </h2>

                <div className="rounded-[18px] border border-slate-200 bg-[#f8fbff] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#2563eb] text-white">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-slate-900">
                        {parkingLot.name}
                      </p>
                      <p className="text-[16px] text-slate-500">주소 정보</p>
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-slate-200 bg-white px-5 py-5">
                    <p className="mb-2 text-[15px] font-semibold text-slate-500">
                      도로명/지번 주소
                    </p>
                    <p className="text-[20px] font-bold text-slate-900">
                      {parkingLot.address}
                    </p>
                  </div>
                </div>
              </section>
            </section>
          </>
        )}
      </main>

      {/* ----------------------------
          공통 푸터
      ---------------------------- */}
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