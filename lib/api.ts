// ─────────────────────────────────────────────
// 백엔드 API Base
// ─────────────────────────────────────────────
export const API_BASE = '/api';

// ─────────────────────────────────────────────
// 공통 응답 타입 — 백엔드 RsData<T>
// ─────────────────────────────────────────────
export interface ApiResponse<T> {
  msg: string;
  resultCode: string;
  data: T;
}

// ─────────────────────────────────────────────
// VehicleType
// ─────────────────────────────────────────────
export type VehicleType = "SMALL" | "LARGE" | "ELECTRIC";

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SMALL: "경차",
  LARGE: "대형차",
  ELECTRIC: "전기차",
};

export const VEHICLE_TYPE_OPTIONS = (
  Object.entries(VEHICLE_TYPE_LABELS) as [VehicleType, string][]
).map(([value, label]) => ({ value, label }));

// ─────────────────────────────────────────────
// Auth 타입
// ─────────────────────────────────────────────
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}
export type LoginResponse = TokenData;

export interface SignupRequest {
  userEmail: string;
  password: string;
  name: string;
  plateNumber: string;
  vehicleType: VehicleType;
}

export interface LoginRequest {
  userEmail: string;
  password: string;
}

export interface UserProfile {
  userId: number;
  userEmail: string;
  userName: string;
  plateNumber: string;
  vehicleType: VehicleType;
  role: "ADMIN" | "USER";
}

export interface VehicleUpdateRequest {
  plateNumber: string;
  vehicleType: VehicleType;
}

export interface WithdrawRequest {
  password: string;
}

// ─────────────────────────────────────────────
// 주차장 타입
// ─────────────────────────────────────────────
export interface ParkingLot {
  id: number;
  name: string;
  address: string;
  totalSpot: number;
  price: number;
  operationStartTime: string;
  operationEndTime: string;
}

export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "PARKED" | "PAYING";
export type SpotType = "SMALL" | "LARGE" | "ELECTRIC";

export interface ParkingSpot {
  id: number;
  status: SpotStatus;
  type: SpotType;
  number: string;
}

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  SMALL: "경차",
  LARGE: "대형",
  ELECTRIC: "전기차",
};

// ─────────────────────────────────────────────
// 예약 타입
// ─────────────────────────────────────────────
export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "결제 대기",
  CONFIRMED: "예약 확정",
  COMPLETED: "이용 완료",
  CANCELED: "취소됨",
};

export interface Reservation {
  reservationId: number;
  parkingLotId: number;
  parkingSpotId: number;
  parkingLotName: string;
  parkingSpotNumber: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPrice: number;
}

export interface CreateReservationRequest {
  parkingLotId: number;
  parkingSpotId: number;
  startTime: string;
  endTime: string;
}

export function toBackendDateTime(datetimeLocal: string): string {
  return datetimeLocal.replace("T", " ") + ":00";
}

// ─────────────────────────────────────────────
// 결제 타입
// ─────────────────────────────────────────────
export type PaymentStatus = "PROCESSING" | "COMPLETE" | "FAILED" | "REFUND";

export interface Payment {
  paymentId: number;
  status: PaymentStatus;
  receiptUuid: string;
}

export interface CreatePaymentRequest {
  reservationId: number;
  amount: number;
}

export interface TossConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

// ─────────────────────────────────────────────
// 관리자 타입
// ─────────────────────────────────────────────
export interface AdminReservation {
  reservationId: number;
  userId: number;
  userName: string;
  userEmail: string;
  parkingLotName: string;
  parkingSpotNumber: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export interface AdminUser {
  userId: number;
  userName: string;
  userEmail: string;
  plateNumber: string;
  vehicleType: string;
  userStatus: string;
  createdTime: string;
}

export interface AdminPayment {
  paymentId: number;
  userId: number;
  userName: string;
  reservationId: number;
  amount: number;
  status: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// 공통 요청 함수
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
// Auth API
// ─────────────────────────────────────────────
export const authApi = {
  signup: (data: SignupRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/signup", { method: "POST", body: data }),

  checkEmail: (email: string) =>
    apiRequest<{ available: boolean; message: string }>(`/users/check-email?email=${encodeURIComponent(email)}`),

  login: (data: LoginRequest) =>
    apiRequest<ApiResponse<TokenData>>("/users/login", { method: "POST", body: data }),

  refresh: (refreshToken: string) =>
    apiRequest<ApiResponse<TokenData>>("/users/refresh", { method: "POST", body: { refreshToken } }),

  logout: (token: string) =>
    apiRequest<ApiResponse<null>>("/users/logout", { method: "POST", token }),

  getProfile: (token: string) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me", { token }),

  updateVehicle: (token: string, data: VehicleUpdateRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me/vehicle", { method: "PATCH", token, body: data }),

  withdraw: (token: string, data: WithdrawRequest) =>
    apiRequest<ApiResponse<null>>("/users/me", { method: "DELETE", token, body: data }),
};

// ─────────────────────────────────────────────
// 주차장 API
// ─────────────────────────────────────────────
export const parkingLotApi = {
  getList: (token: string, dong?: string) =>
    apiRequest<ApiResponse<ParkingLot[]>>(
      `/parking-lots${dong ? `?dong=${encodeURIComponent(dong)}` : ""}`,
      { token }
    ),

  getDetail: (token: string, id: number) =>
    apiRequest<ApiResponse<ParkingLot>>(`/parking-lots/${id}`, { token }),

  getAvailableSpots: (token: string, parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(`/parking-spots/${parkingLotId}/spots/available`, { token }),

  getAllSpots: (token: string, parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(`/parking-spots/${parkingLotId}/spots`, { token }),
};

// ─────────────────────────────────────────────
// 예약 API
// ─────────────────────────────────────────────
export const reservationApi = {
  create: (token: string, data: any) =>
    apiRequest<ApiResponse<Reservation>>("/reservations", { method: "POST", token, body: data }),

  getList: (token: string) =>
    apiRequest<ApiResponse<Reservation[]>>("/reservations", { token }),

  getDetail: (token: string, id: number) =>
    apiRequest<ApiResponse<Reservation>>(`/reservations/${id}`, { token }),

  cancel: (token: string, id: number) =>
    apiRequest<ApiResponse<null>>(`/reservations/${id}/cancel`, { method: "PATCH", token }),
};

// ─────────────────────────────────────────────
// 결제 API
// ─────────────────────────────────────────────
export const paymentApi = {
  start: (token: string, data: CreatePaymentRequest) =>
    apiRequest<ApiResponse<Payment>>("/payments", { method: "POST", token, body: data }),

  approve: (token: string, paymentId: number, data: TossConfirmRequest) =>
    apiRequest<ApiResponse<Payment>>(`/payments/${paymentId}/approve`, { method: "POST", token, body: data }),
};

// ─────────────────────────────────────────────
// 관리자 API
// ─────────────────────────────────────────────
export const adminReservationApi = {
  getList: (token: string, userId?: number, page = 0, size = 10) =>
    apiRequest<ApiResponse<any>>(
      `/admin/reservations?page=${page}&size=${size}${userId ? `&userId=${userId}` : ""}`,
      { token }
    ),

  cancel: (token: string, reservationId: number) =>
    apiRequest<ApiResponse<null>>(`/admin/reservations/${reservationId}/cancel`, { method: "PATCH", token }),
};

export const adminUserApi = {
  getList: (token: string, keyword?: string, page = 0, size = 10) =>
    apiRequest<ApiResponse<any>>(
      `/admin/users?page=${page}&size=${size}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""}`,
      { token }
    ),
};

export const adminPaymentApi = {
  getAll: (token: string) =>
    apiRequest<ApiResponse<AdminPayment[]>>(`/admin/payments`, { token }),

  getByUser: (token: string, userId: number) =>
    apiRequest<ApiResponse<AdminPayment[]>>(`/admin/payments/${userId}`, { token }),

  refund: (token: string, paymentId: number) =>
    apiRequest<ApiResponse<null>>(`/admin/payments/${paymentId}/refund`, { method: "PATCH", token }),
};