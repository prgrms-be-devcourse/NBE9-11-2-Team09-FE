'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentApi, TokenData } from '@/lib/api';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    const confirmPayment = async () => {
      // lib/api.ts의 로직에 맞춰 localStorage의 'auth' 키에서 토큰 추출
      const authData = localStorage.getItem('auth');
      if (!authData) {
        alert("로그인 정보가 없습니다.");
        router.push('/login');
        return;
      }

      const { accessToken } = JSON.parse(authData) as TokenData;
      const paymentId = searchParams.get('paymentId');
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentId || !paymentKey || !orderId || !amount) {
        setStatus('error');
        return;
      }

      try {
        // ✅ lib/api.ts에 정의된 함수를 사용합니다.
        await paymentApi.approve(accessToken, Number(paymentId), {
          paymentKey,
          orderId,
          amount: Number(amount)
        });

        setStatus('success');
        setTimeout(() => router.push('/reservations'), 2000);
      } catch (err) {
        console.error("승인 에러:", err);
        setStatus('error');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  // (Return 부분은 기존 UI 유지)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        {status === 'confirming' && <p>결제 승인 중...</p>}
        {status === 'success' && <p>✅ 결제 성공! 곧 이동합니다.</p>}
        {status === 'error' && <p>❌ 결제 실패. 관리자에게 문의하세요.</p>}
    </div>
  );
}