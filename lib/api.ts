// ─────────────────────────────────────────────
// 백엔드 API Base (Next.js rewrites로 /api → 8080 프록시)
// ─────────────────────────────────────────────
const API_BASE = "/api";

// ─────────────────────────────────────────────
// 공통 요청 함수 (401 시 자동 토큰 갱신 포함)
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
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → refreshToken으로 자동 재발급 후 재시도
  if (response.status === 401 && !_retry) {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TokenData;
        if (parsed.refreshToken) {
          const refreshRes = await fetch(`${API_BASE}/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // RefreshTokenReqDto: { refreshToken }
            body: JSON.stringify({ refreshToken: parsed.refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshJson = (await refreshRes.json()) as ApiResponse<TokenData>;
            const newTokens = refreshJson.data;
            localStorage.setItem("auth", JSON.stringify(newTokens));
            // 원래 요청 재시도
            return apiRequest<T>(endpoint, {
              ...options,
              token: newTokens.accessToken,
              _retry: true,
            });
          }
        }
      } catch {
        // 갱신 실패 → 로그인 페이지로
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    }
  }

  if (!response.ok) {
    // 백엔드 RsData: { msg, resultCode, data }
    const error = (await response.json().catch(() => ({}))) as { msg?: string };
    throw new Error(error.msg || "API 요청에 실패했습니다.");
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// 공통 응답 타입 — 백엔드 RsData<T>
// ─────────────────────────────────────────────
export interface ApiResponse<T> {
  msg: string;
  resultCode: string;
  data: T;
}


// ─────────────────────────────────────────────
// VehicleType (백엔드 enum: SMALL | LARGE | ELECTRIC)
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
// Auth 타입 (백엔드 DTO 기준)
// ─────────────────────────────────────────────

// LoginResDto: { accessToken, refreshToken, tokenType }
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}
// 하위 호환 alias
export type LoginResponse = TokenData;

// SignupReqDto: { userEmail, password, name, plateNumber, vehicleType }
export interface SignupRequest {
  userEmail: string;     // ← 백엔드 필드명
  password: string;
  name: string;
  plateNumber: string;   // ← 백엔드 필드명 (vehicleNumber 아님)
  vehicleType: VehicleType;
}

// LoginReqDto: { userEmail, password }
export interface LoginRequest {
  userEmail: string;     // ← 백엔드 필드명 (email 아님)
  password: string;
}

// UserProfileResDto: { userId, userEmail, userName, plateNumber, vehicleType }
export interface UserProfile {
  userId: number;
  userEmail: string;
  userName: string;
  plateNumber: string;
  vehicleType: VehicleType;
}

// VehicleUpdateReqDto: { plateNumber, vehicleType }
export interface VehicleUpdateRequest {
  plateNumber: string;
  vehicleType: VehicleType;
}

// WithdrawReqDto: { password }
export interface WithdrawRequest {
  password: string;
}

// ─────────────────────────────────────────────
// 주차장 타입 (백엔드 ParkingLotResDto 기준)
// ─────────────────────────────────────────────
export interface ParkingLot {
  id: number;
  name: string;
  address: string;
  totalSpot: number;          // 백엔드 필드명
  price: number;              // 10분당 원
  operationStartTime: string; // "HH:mm:ss"
  operationEndTime: string;   // "HH:mm:ss"
}

// ParkingSpotDto: { id, status, type, number }
export interface ParkingSpot {
  id: number;
  status: SpotStatus;
  type: SpotType;
  number: string;
}

export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "PARKED" | "PAYING";
export type SpotType = "SMALL" | "LARGE" | "ELECTRIC";

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  SMALL: "경차",
  LARGE: "대형",
  ELECTRIC: "전기차",
};

// ─────────────────────────────────────────────
// 예약 타입 (백엔드 ReservationResDto 기준)
// ─────────────────────────────────────────────
export interface Reservation {
  reservationId: number;
  parkingLotName: string;
  parkingSpotNumber: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export type ReservationStatus =
  | "PENDING"    // 결제 전
  | "CONFIRMED"  // 예약 확정
  | "COMPLETED"  // 주차 완료
  | "CANCELED";  // 취소

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "결제 대기",
  CONFIRMED: "예약 확정",
  COMPLETED: "이용 완료",
  CANCELED: "취소됨",
};

// ReservationReqDto: { parkingLotId, parkingSpotId, startTime, endTime }
// 주의: 시간 포맷 → "yyyy-MM-dd HH:mm:ss"
export interface CreateReservationRequest {
  parkingLotId: number;
  parkingSpotId: number;
  startTime: string;
  endTime: string;
}

// datetime-local 값("yyyy-MM-ddTHH:mm") → 백엔드 포맷("yyyy-MM-dd HH:mm:ss")
export function toBackendDateTime(datetimeLocal: string): string {
  return datetimeLocal.replace("T", " ") + ":00";
}

// ─────────────────────────────────────────────
// 결제 타입 (백엔드 PaymentRespDto 기준)
// ─────────────────────────────────────────────
export interface Payment {
  paymentId: number;
  status: PaymentStatus;
  receiptUuid: string;
}

export type PaymentStatus = "PROCESSING" | "COMPLETE" | "FAILED" | "REFUND";

export interface CreatePaymentRequest {
  reservationId: number;
  amount: number;
}

export interface TossConfirmRequest {
  paymentKey: string;  // 토스에서 발급한 결제 키
  orderId: string;     // receiptUuid (start API 응답값)
  amount: number;      // 결제 금액
}

// ─────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────
export const authApi = {
  // POST /api/users/signup → RsData<UserProfileResDto>
  signup: (data: SignupRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/signup", {
      method: "POST",
      body: data,
    }),

  // GET /api/users/check-email?email=... → RsData<Boolean>
  checkEmail: (email: string) =>
  apiRequest<{ available: boolean; message: string }>(`/users/check-email?email=${encodeURIComponent(email)}`),

  // POST /api/users/login → RsData<LoginResDto>
  login: (data: LoginRequest) =>
    apiRequest<ApiResponse<TokenData>>("/users/login", {
      method: "POST",
      body: data,
    }),

  // POST /api/users/refresh → RsData<LoginResDto>
  refresh: (refreshToken: string) =>
    apiRequest<ApiResponse<TokenData>>("/users/refresh", {
      method: "POST",
      body: { refreshToken },
    }),

  // POST /api/users/logout
  logout: (token: string) =>
    apiRequest<ApiResponse<null>>("/users/logout", {
      method: "POST",
      token,
    }),

  // GET /api/users/me → RsData<UserProfileResDto>
  getProfile: (token: string) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me", { token }),

  // PATCH /api/users/me/vehicle → RsData<UserProfileResDto>
  updateVehicle: (token: string, data: VehicleUpdateRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me/vehicle", {
      method: "PATCH",
      token,
      body: data,
    }),

  // DELETE /api/users/me
  withdraw: (token: string, data: WithdrawRequest) =>
    apiRequest<ApiResponse<null>>("/users/me", {
      method: "DELETE",
      token,
      body: data,
    }),
};

// ─────────────────────────────────────────────
// Parking Lot API
// ─────────────────────────────────────────────
export const parkingLotApi = {
  // GET /api/parking-lots?dong={dong}
  getList: (token: string, dong?: string) =>
    apiRequest<ApiResponse<ParkingLot[]>>(
      `/parking-lots${dong ? `?dong=${encodeURIComponent(dong)}` : ""}`,
      { token }
    ),

  // GET /api/parking-lots/{id}
  getDetail: (token: string, id: number) =>
    apiRequest<ApiResponse<ParkingLot>>(`/parking-lots/${id}`, { token }),

  // GET /api/parking-spots/{lotId}/spots/available
  getAvailableSpots: (token: string, parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(
      `/parking-spots/${parkingLotId}/spots/available`,
      { token }
    ),

  // GET /api/parking-spots/{lotId}/spots
  getAllSpots: (token: string, parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(
      `/parking-spots/${parkingLotId}/spots`,
      { token }
    ),
};

// ─────────────────────────────────────────────
// Reservation API
// ─────────────────────────────────────────────
export const reservationApi = {
  // GET /api/reservations?status={status}
  getList: (token: string, status?: ReservationStatus) =>
    apiRequest<ApiResponse<Reservation[]>>(
      `/reservations${status ? `?status=${status}` : ""}`,
      { token }
    ),

  // GET /api/reservations/{id}
  getDetail: (token: string, id: number) =>
    apiRequest<ApiResponse<Reservation>>(`/reservations/${id}`, { token }),

  // POST /api/reservations
  create: (token: string, data: CreateReservationRequest) =>
    apiRequest<ApiResponse<Reservation>>("/reservations", {
      method: "POST",
      token,
      body: data,
    }),

  // PATCH /api/reservations/{id}/cancel
  cancel: (token: string, id: number) =>
    apiRequest<ApiResponse<null>>(`/reservations/${id}/cancel`, {
      method: "PATCH",
      token,
    }),
};

// ─────────────────────────────────────────────
// Payment API
// ─────────────────────────────────────────────
export const paymentApi = {
  // POST /api/payments → { reservationId, amount }
  start: (token: string, data: CreatePaymentRequest) =>
    apiRequest<ApiResponse<Payment>>("/payments", {
      method: "POST",
      token,
      body: data,
    }),

  // POST /api/payments/{paymentId}/approve
  approve: (token: string, paymentId: number, data: TossConfirmRequest) =>
    apiRequest<ApiResponse<Payment>>(`/payments/${paymentId}/approve`, {
      method: "POST",
      token,
      body: data,
    }),
};
