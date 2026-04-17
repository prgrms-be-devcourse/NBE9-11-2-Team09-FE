"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  sortBy: "name" | "price" | "availability";
  hasAvailable: boolean;
}

const SEOUL_DONGS = [
  "전체",
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

export function SearchFilters({ onSearch, onFilterChange }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDong, setSelectedDong] = useState("전체");
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "name",
    hasAvailable: false,
  });

  const handleSearch = () => {
    onSearch(selectedDong === "전체" ? searchQuery : selectedDong);
  };

  const handleDongSelect = (dong: string) => {
    setSelectedDong(dong);
    if (dong !== "전체") {
      setSearchQuery("");
      onSearch(dong);
    } else {
      onSearch(searchQuery);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="주차장 이름 또는 주소로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 h-11"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                onSearch("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} className="h-11 px-6">
          검색
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* District Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SEOUL_DONGS.slice(0, 10).map((dong) => (
          <button
            key={dong}
            onClick={() => handleDongSelect(dong)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedDong === dong
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {dong}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-muted text-muted-foreground hover:bg-muted/80"
        >
          더보기...
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-4">
          {/* All Districts */}
          <div>
            <h4 className="text-sm font-medium mb-2">지역 선택</h4>
            <div className="flex flex-wrap gap-2">
              {SEOUL_DONGS.map((dong) => (
                <button
                  key={dong}
                  onClick={() => handleDongSelect(dong)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    selectedDong === dong
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:bg-background/80 border border-border"
                  )}
                >
                  {dong}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium mb-2">정렬</h4>
            <div className="flex gap-2">
              {[
                { value: "name", label: "이름순" },
                { value: "price", label: "가격순" },
                { value: "availability", label: "여유순" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleFilterChange("sortBy", option.value as FilterOptions["sortBy"])
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filters.sortBy === option.value
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:bg-background/80 border border-border"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">추가 필터</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasAvailable}
                onChange={(e) => handleFilterChange("hasAvailable", e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                주차 가능한 곳만 보기
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
