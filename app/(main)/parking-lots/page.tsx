"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ParkingLotCard } from "@/components/parking/parking-lot-card";
import { SearchFilters, type FilterOptions } from "@/components/parking/search-filters";
import { parkingLotApi, type ParkingLot } from "@/lib/api";
import { Car, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// 목데이터 - 백엔드 ParkingLotResDto 필드명과 일치
const MOCK_PARKING_LOTS: ParkingLot[] = [
  { id: 1, name: "강남역 공영주차장",    address: "서울 강남구 강남대로 396",   totalSpot: 150, price: 1000, operationStartTime: "00:00:00", operationEndTime: "23:59:00" },
  { id: 2, name: "역삼1동 공영주차장",   address: "서울 강남구 역삼동 123-45",  totalSpot: 80,  price: 800,  operationStartTime: "09:00:00", operationEndTime: "18:00:00" },
  { id: 3, name: "삼성동 공영주차장",    address: "서울 강남구 삼성동 159",     totalSpot: 500, price: 1200, operationStartTime: "00:00:00", operationEndTime: "23:59:00" },
  { id: 4, name: "대치동 공영주차장",    address: "서울 강남구 대치동 890-1",   totalSpot: 200, price: 800,  operationStartTime: "07:00:00", operationEndTime: "22:00:00" },
  { id: 5, name: "논현동 공영주차장",    address: "서울 강남구 논현동 215-4",   totalSpot: 300, price: 1000, operationStartTime: "00:00:00", operationEndTime: "23:59:00" },
  { id: 6, name: "압구정동 공영주차장",  address: "서울 강남구 압구정동 301",   totalSpot: 120, price: 900,  operationStartTime: "00:00:00", operationEndTime: "23:59:00" },
];

export default function ParkingLotsPage() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ sortBy: "name", hasAvailable: false });

  const fetchParkingLots = async (dong?: string) => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/parking-lots?dong={dong}
      const response = await parkingLotApi.getList(dong);
      setParkingLots(response.data);
      setFilteredLots(response.data);
    } catch {
      // API 실패 시 목데이터 사용
      const filtered = dong
        ? MOCK_PARKING_LOTS.filter(l => l.name.includes(dong) || l.address.includes(dong))
        : MOCK_PARKING_LOTS;
      setParkingLots(filtered);
      setFilteredLots(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParkingLots(); }, []);

  const handleSearch = (query: string) => {
    if (!query) { setFilteredLots(parkingLots); return; }
    setFilteredLots(parkingLots.filter(l =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.address.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    let sorted = [...filteredLots];
    if (newFilters.sortBy === "price") {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
    setFilteredLots(sorted);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">주차장 찾기</h1>
          <p className="text-muted-foreground">원하는 지역의 주차장을 검색하고 미리 예약하세요</p>
        </div>

        <div className="mb-8">
          <SearchFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{filteredLots.length}</span>개의 주차장
          </p>
          <Button variant="ghost" size="sm" onClick={() => fetchParkingLots()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">주차장을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button onClick={() => fetchParkingLots()}>다시 시도</Button>
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Car className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-2">검색 결과가 없습니다</p>
            <p className="text-muted-foreground text-sm">다른 검색어나 필터를 시도해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLots.map(lot => <ParkingLotCard key={lot.id} parkingLot={lot} />)}
          </div>
        )}
      </main>
    </div>
  );
}
