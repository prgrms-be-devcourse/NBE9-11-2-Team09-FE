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
  const [duration, setDuration] = useState<number>(1); // 이용 시간은 다시 시간(hour) 단위로 관리

  // 이용 시간 버튼 옵션 (시간 단위로 복구)
  const DURATION_OPTIONS = [0.5, 1, 2, 3, 4, 6, 8, 12, 24];

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  // 시작 시간 선택 - 10분 단위로 설정
  const minutes = [0, 10, 20, 30, 40, 50];

  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "오늘";
    if (date.toDateString() === tomorrow.toDateString()) return "내일";
    return `${month}/${day}(${dayOfWeek})`;
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const start = new Date(selectedDate);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(start);
    // 이용 시간(duration)은 시간 단위이므로 밀리초 계산 시 60 * 60 * 1000 적용
    end.setTime(start.getTime() + duration * 60 * 60 * 1000);

    onStartTimeChange(start);
    onEndTimeChange(end);
  }, [selectedDate, startHour, startMinute, duration, onStartTimeChange, onEndTimeChange]);

  return (
    <div className="space-y-6">
      {/* 날짜 선택 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Calendar className="w-4 h-4" /> 날짜 선택
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all min-w-[80px]",
                selectedDate.toDateString() === date.toDateString()
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <div>{formatDate(date)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 시작 시간 선택 (10분 단위) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
          <Clock className="w-4 h-4" /> 시작 시간
        </label>
        <div className="flex gap-2">
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-foreground"
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>{hour.toString().padStart(2, "0")}시</option>
            ))}
          </select>
          <select
            value={startMinute}
            onChange={(e) => setStartMinute(Number(e.target.value))}
            className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-foreground"
          >
            {minutes.map((minute) => (
              <option key={minute} value={minute}>{minute.toString().padStart(2, "0")}분</option>
            ))}
          </select>
        </div>
      </div>

      {/* 이용 시간 선택 (시간 단위 버튼) */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">이용 시간</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                duration === d
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {d < 1 ? "30분" : d === 1 ? "1시간" : `${d}시간`}
            </button>
          ))}
        </div>
      </div>

      {/* 시간 요약 */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">이용 시간</p>
            <p className="font-medium text-foreground">
              {startTime && endTime ? (
                <>{formatTime(startTime.getHours(), startTime.getMinutes())} ~ {formatTime(endTime.getHours(), endTime.getMinutes())}</>
              ) : "-"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">총 이용 시간</p>
            <p className="font-medium text-foreground">
              {duration < 1 ? "30분" : duration === 1 ? "1시간" : `${duration}시간`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}