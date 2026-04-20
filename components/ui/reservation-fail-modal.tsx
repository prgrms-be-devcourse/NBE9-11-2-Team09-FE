interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function ReservationFailPopup({ isOpen, onClose, onRetry }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-bold text-red-500 mb-2">결제 시간이 초과되었습니다</h3>
        <p className="text-gray-500 text-sm mb-6">5분 내에 결제를 완료해주세요. 다시 시도하시겠습니까?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">닫기</button>
          <button onClick={onRetry} className="flex-1 py-3 bg-[#2892d7] text-white rounded-xl font-bold">다시 시도</button>
        </div>
      </div>
    </div>
  );
}