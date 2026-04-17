"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context"; // 추가
import { Header } from "@/components/layout/header";
import { ParkingLotCard } from "@/components/parking/parking-lot-card";
import { SearchFilters, type FilterOptions } from "@/components/parking/search-filters";
import { parkingLotApi, type ParkingLot } from "@/lib/api";
import { Car, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ParkingLotsPage() {
  const { user, isLoading: authLoading } = useAuth(); // 인증 정보 가져오기
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ sortBy: "name", hasAvailable: false });

  const fetchParkingLots = async (dong?: string) => {
    if (!user?.accessToken) return; // 토큰이 없으면 실행하지 않음
    
    setLoading(true);
    setError(null);
    try {
      // 토큰 포함 호출
      const response = await parkingLotApi.getList(user.accessToken, dong);
      setParkingLots(response.data);
      setFilteredLots(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주차장 목록을 불러오지 못했습니다.");
      setParkingLots([]);
      setFilteredLots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (!authLoading && user?.accessToken) {
      fetchParkingLots(); 
    }
  }, [authLoading, user]);

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