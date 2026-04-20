'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth-context";
import { reservationApi } from "@/lib/api";
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useSearchParams, useRouter } from 'next/navigation';

const clientKey = "test_ck_Ba5PzR0ArnyZwjL0NZYBVvmYnNeD";

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const parkingLotId = Number(searchParams.get('parkingLotId'));
  const amount = Number(searchParams.get('price')) || 0;
  const paymentIdFromUrl = searchParams.get('paymentId');

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'GUEST') : 'GUEST';

  // 5분 타이머 - 만료 시 alert + 주차장 목록으로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      alert("결제 시간이 초과되었습니다. 예약이 자동 취소됩니다.");
      router.push("/parking-lots");
    }, 300000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleProcessPayment = async () => {
    const safeOrderId = paymentIdFromUrl && paymentIdFromUrl.length >= 6
      ? paymentIdFromUrl
      : `PAYMENT_${paymentIdFromUrl}_${Date.now()}`;

    if (!paymentIdFromUrl || amount === 0) {
      alert("결제 정보가 부족합니다. 다시 시도해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: `USER_${userId}`,
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: amount,
        },
        orderId: safeOrderId,
        orderName: "주차장 예약 결제",
        successUrl: `${window.location.origin}/payment/success?paymentId=${paymentIdFromUrl}`,
        failUrl: `${window.location.origin}/payment/fail?parkingLotId=${parkingLotId}`,
      });

    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        const stored = sessionStorage.getItem("pendingReservation");
        if (stored && user?.accessToken) {
          const { reservationId } = JSON.parse(stored);
          await reservationApi.cancel(user.accessToken, reservationId);
          sessionStorage.removeItem("pendingReservation");
        }
        router.push(`/parking-lots`);
      } else {
        alert(error.message || "결제 진행 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <header className="px-10 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2892d7] rounded flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold">주차장 조회 서비스</span>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto w-full py-12 px-6 flex flex-col md:flex-row gap-10">
        <section className="flex-1">
          <h2 className="text-2xl font-bold mb-8 italic text-[#2892d7]">Payment Confirmation</h2>
          <div className="border border-gray-100 rounded-3xl p-8 bg-gray-50/50">
            <h3 className="text-lg font-bold mb-6">예약 내역 확인</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-4">
                <span className="text-gray-400">총 결제 금액</span>
                <span className="font-bold">{amount.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full md:w-[350px]">
          <div className="sticky top-28 p-8 border border-gray-100 rounded-3xl bg-white shadow-sm shadow-gray-50">
            <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Order Summary</h3>
            <div className="flex justify-between items-center mb-8">
              <span className="text-gray-900 font-bold text-lg">총 결제 금액</span>
              <span className="text-[#2892d7] font-extrabold text-2xl">{amount.toLocaleString()}원</span>
            </div>
            <button
              onClick={handleProcessPayment}
              disabled={isLoading}
              className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-[#2892d7] hover:opacity-90 shadow-[#2892d7]/20 active:scale-[0.98]'
              }`}
            >
              {isLoading ? '결제창 로딩 중...' : '결제하기'}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}