// ─────────────────────────────────────────────
// 백엔드 API Base
// ─────────────────────────────────────────────
export const API_BASE = 'http://localhost:8080/api';

// ─────────────────────────────────────────────
// [중요] UI에서 참조하는 상수 (Labels & Options)
// ─────────────────────────────────────────────

// 차량 타입
export type VehicleType = "SMALL" | "LARGE" | "ELECTRIC";
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SMALL: "경차",
  LARGE: "대형차",
  ELECTRIC: "전기차",
};
export const VEHICLE_TYPE_OPTIONS = (
  Object.entries(VEHICLE_TYPE_LABELS) as [VehicleType, string][]
).map(([value, label]) => ({ value, label }));

// 주차 구역 타입
export type SpotType = "SMALL" | "LARGE" | "ELECTRIC";
export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  SMALL: "경차",
  LARGE: "대형",
  ELECTRIC: "전기차",
};

// 예약 상태 (현재 발생 중인 CONFIRMED 에러 해결)
export type ReservationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "결제 대기",
  CONFIRMED: "예약 확정",
  COMPLETED: "이용 완료",
  CANCELED: "취소됨",
};

// ─────────────────────────────────────────────
// 공통 타입 정의 (Interfaces)
// ─────────────────────────────────────────────
export interface ApiResponse<T> {
  msg: string;
  resultCode: string;
  data: T;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface UserProfile {
  userId: number;
  userEmail: string;
  userName: string;
  plateNumber: string;
  vehicleType: VehicleType;
}

export interface ParkingLot {
  id: number;
  name: string;
  address: string;
  totalSpot: number;
  price: number;
  operationStartTime: string;
  operationEndTime: string;
}

export interface ParkingSpot {
  id: number;
  status: "AVAILABLE" | "OCCUPIED" | "PARKED" | "PAYING";
  type: VehicleType;
  number: string;
}

export interface Reservation {
  reservationId: number;
  parkingLotName: string;
  parkingSpotNumber: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export interface Payment {
  paymentId: number;
  status: "PROCESSING" | "COMPLETE" | "FAILED" | "REFUND";
  receiptUuid: string;
}

// ─────────────────────────────────────────────
// 공통 요청 함수 (apiRequest)
// ─────────────────────────────────────────────
type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  _retry?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, _retry = false } = options;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token.trim()}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !_retry) {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TokenData;
        if (parsed.refreshToken) {
          const refreshRes = await fetch(`${API_BASE}/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: parsed.refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshJson = (await refreshRes.json()) as ApiResponse<TokenData>;
            const newTokens = refreshJson.data;
            localStorage.setItem("auth", JSON.stringify(newTokens));
            return apiRequest<T>(endpoint, { ...options, token: newTokens.accessToken, _retry: true });
          }
        }
      } catch {
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || "API 요청 실패");
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// API 객체
// ─────────────────────────────────────────────
export const authApi = {
  signup: (data: any) => apiRequest<ApiResponse<UserProfile>>("/users/signup", { method: "POST", body: data }),
  login: (data: any) => apiRequest<ApiResponse<TokenData>>("/users/login", { method: "POST", body: data }),
  getProfile: (token: string) => apiRequest<ApiResponse<UserProfile>>("/users/me", { token }),
};

export const parkingLotApi = {
  getList: (dong?: string) => apiRequest<ApiResponse<ParkingLot[]>>(`/parking-lots${dong ? `?dong=${encodeURIComponent(dong)}` : ""}`),
  getDetail: (id: number) => apiRequest<ApiResponse<ParkingLot>>(`/parking-lots/${id}`),
  getAvailableSpots: (lotId: number) => apiRequest<ApiResponse<ParkingSpot[]>>(`/parking-spots/${lotId}/spots/available`),
};

export const reservationApi = {
  create: (token: string, data: any) => apiRequest<ApiResponse<Reservation>>("/reservations", { method: "POST", token, body: data }),
  getList: (token: string) => apiRequest<ApiResponse<Reservation[]>>("/reservations", { token }),
  cancel: (token: string, id: number) => apiRequest<ApiResponse<null>>(`/reservations/${id}/cancel`, { method: "PATCH", token }),
};

export const paymentApi = {
  start: (token: string, data: { reservationId: number; amount: number }) =>
    apiRequest<ApiResponse<Payment>>("/payments", { method: "POST", token, body: data }),
  approve: (token: string, paymentId: number, tossData: any) =>
    apiRequest<ApiResponse<any>>(`/payments/${paymentId}/approve`, { method: "POST", token, body: tossData }),
};

export function toBackendDateTime(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  return datetimeLocal.replace("T", " ") + ":00";
}