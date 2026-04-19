'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parkingLotId = searchParams.get('parkingLotId');

  useEffect(() => {
    // 3초 후 주차장 자리 화면으로 이동
    const timer = setTimeout(() => {
      router.push(`/parking/${parkingLotId}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">결제가 취소되었습니다</h2>
      <p className="text-gray-500 mb-4">결제 시간이 초과되었거나 취소되었습니다.</p>
      <p className="text-gray-400 text-sm">잠시 후 주차장 화면으로 이동합니다...</p>
    </div>
  );
}