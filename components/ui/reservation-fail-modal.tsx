"use client";

import { useRouter } from "next/navigation";

interface PaymentTimeoutModalProps {
  isOpen: boolean;
}

export default function PaymentTimeoutModal({ isOpen }: PaymentTimeoutModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 mx-4">
        <div className="text-center">
          {/* 타이틀: 강조를 위해 빨간색 유지 */}
          <h2 className="text-xl font-extrabold text-red-500 mb-4">
            결제 시간이 초과되었습니다
          </h2>

          <p className="text-slate-500 leading-relaxed mb-10 text-sm">
            5분 내에 결제를 완료하지 못해 <br />
            예약이 자동으로 취소되었습니다. <br />
            다시 한 번 주차장을 선택해 주세요.
          </p>

          {/* 단일 버튼: 주차장 찾기 화면으로 이동 */}
          <button
            onClick={() => router.push("/parking-lots")}
            className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-100 hover:bg-sky-600 active:scale-95 transition-all"
          >
            주차장 찾기로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}