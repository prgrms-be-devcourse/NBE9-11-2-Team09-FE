"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  startTime: Date | null;
  endTime: Date | null;
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange: (date: Date) => void;
}

export function TimePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState<number>(new Date().getHours());
  const [startMinute, setStartMinute] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);

  const DURATION_OPTIONS = [0.5, 1, 2, 3, 4, 6, 8, 12, 24];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  // 현재 시간 이후의 시간(Hour)만 필터링
  const hours = Array.from({ length: 24 }, (_, i) => i).filter((h) => {
    if (!isToday) return true;
    return h >= now.getHours();
  });

  // 현재 시간 이후의 분(Minute)만 필터링 (같은 시간대일 경우)
  const minutes = [0, 10, 20, 30, 40, 50].filter((m) => {
    if (!isToday || startHour > now.getHours()) return true;
    return m > now.getMinutes();
  });

  // 유효하지 않은 시간이 선택되어 있을 경우 자동 조정
  useEffect(() => {
    if (isToday) {
      if (startHour < now.getHours()) {
        setStartHour(now.getHours());
      }
      if (startHour === now.getHours() && (minutes.length > 0 && !minutes.includes(startMinute))) {
        setStartMinute(minutes[0]);
      }
    }
  }, [selectedDate, startHour, isToday, minutes, startMinute]);

  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (date.toDateString() === now.toDateString()) return "오늘";
    if (date.toDateString() === new Date(now.getTime() + 86400000).toDateString()) return "내일";
    return `${month}/${day}(${days[date.getDay()]})`;
  };

  useEffect(() => {
    const start = new Date(selectedDate);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    onStartTimeChange(start);
    onEndTimeChange(end);
  }, [selectedDate, startHour, startMinute, duration, onStartTimeChange, onEndTimeChange]);

  return (
    <div className="space-y-6">
      {/* 날짜 선택 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3"><Calendar className="w-4 h-4" /> 날짜 선택</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => (
            <button key={date.toISOString()} onClick={() => setSelectedDate(date)}
              className={cn("px-4 py-3 rounded-xl text-sm font-medium transition-all min-w-[80px]",
                selectedDate.toDateString() === date.toDateString() ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* 시작 시간 선택 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-3"><Clock className="w-4 h-4" /> 시작 시간</label>
        <div className="flex gap-2">
          <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className="flex-1 h-11 px-4 rounded-lg border bg-background">
            {hours.map((h) => <option key={h} value={h}>{h.toString().padStart(2, "0")}시</option>)}
          </select>
          <select value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))} className="flex-1 h-11 px-4 rounded-lg border bg-background">
            {minutes.length > 0 ? minutes.map((m) => <option key={m} value={m}>{m.toString().padStart(2, "0")}분</option>) : <option disabled>선택 불가</option>}
          </select>
        </div>
      </div>

      {/* 이용 시간 버튼 */}
      <div>
        <label className="text-sm font-medium mb-3 block">이용 시간</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button key={d} onClick={() => setDuration(d)}
              className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                duration === d ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {d < 1 ? "30분" : `${d}시간`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}