const API_BASE = "/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  _retry?: boolean;
};

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

export type VehicleType = "SMALL" | "LARGE" | "ELECTRIC";

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SMALL: "소형",
  LARGE: "대형",
  ELECTRIC: "전기차",
};

export const VEHICLE_TYPE_OPTIONS = (
  Object.entries(VEHICLE_TYPE_LABELS) as [VehicleType, string][]
).map(([value, label]) => ({ value, label }));

export interface SignupRequest {
  userEmail: string;
  password: string;
  name: string;
  plateNumber: string;
  vehicleType: VehicleType;
}

export interface EmailCheckResponse {
  available: boolean;
  message: string;
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
}

export interface VehicleUpdateRequest {
  plateNumber: string;
  vehicleType: VehicleType;
}

export interface WithdrawRequest {
  password: string;
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

export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "PARKED" | "PAYING";
export type SpotType = "SMALL" | "LARGE" | "ELECTRIC";

export interface ParkingSpot {
  id: number;
  status: SpotStatus;
  type: SpotType;
  number: string;
}

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  SMALL: "소형",
  LARGE: "대형",
  ELECTRIC: "전기차",
};

export interface Reservation {
  reservationId: number;
  parkingLotName: string;
  parkingSpotNumber: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
}

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "결제 대기",
  CONFIRMED: "예약 확정",
  COMPLETED: "이용 완료",
  CANCELED: "취소",
};

export interface CreateReservationRequest {
  parkingLotId: number;
  parkingSpotId: number;
  startTime: string;
  endTime: string;
}

export function toBackendDateTime(datetimeLocal: string): string {
  return datetimeLocal.replace("T", " ") + ":00";
}

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

function extractTokenData(raw: unknown): TokenData | null {
  if (!raw || typeof raw !== "object") return null;

  const source =
    "data" in (raw as Record<string, unknown>)
      ? (raw as { data?: unknown }).data
      : raw;

  if (!source || typeof source !== "object") return null;

  const candidate = source as Partial<TokenData>;

  if (
    typeof candidate.accessToken !== "string" ||
    typeof candidate.refreshToken !== "string" ||
    typeof candidate.tokenType !== "string"
  ) {
    return null;
  }

  return {
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
    tokenType: candidate.tokenType,
  };
}

function parseErrorMessage(raw: string): string {
  const fallback = "API 요청에 실패했습니다.";

  if (!raw.trim()) return fallback;

  try {
    const parsed = JSON.parse(raw) as {
      msg?: string;
      message?: string;
      error?: string;
    };

    return parsed.msg || parsed.message || parsed.error || fallback;
  } catch {
    return raw;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, _retry = false } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if ((response.status === 401 || response.status === 403) && !_retry && token) {
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
            const refreshJson = (await refreshRes.json()) as unknown;
            const newTokens = extractTokenData(refreshJson);

            if (!newTokens) {
              throw new Error("Invalid refresh payload");
            }

            localStorage.setItem("auth", JSON.stringify(newTokens));

            return apiRequest<T>(endpoint, {
              ...options,
              token: newTokens.accessToken,
              _retry: true,
            });
          }
        }
      } catch {
        localStorage.removeItem("auth");
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    localStorage.removeItem("auth");
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(parseErrorMessage(raw));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  signup: (data: SignupRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/signup", {
      method: "POST",
      body: data,
    }),

  login: (data: LoginRequest) =>
    apiRequest<ApiResponse<TokenData>>("/users/login", {
      method: "POST",
      body: data,
    }),

  refresh: (refreshToken: string) =>
    apiRequest<ApiResponse<TokenData>>("/users/refresh", {
      method: "POST",
      body: { refreshToken },
    }),

  checkEmail: (email: string) =>
    apiRequest<EmailCheckResponse>(
      `/users/check-email?email=${encodeURIComponent(email)}`
    ),

  logout: (token: string) =>
    apiRequest<ApiResponse<null>>("/users/logout", {
      method: "POST",
      token,
    }),

  getProfile: (token: string) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me", {
      token,
    }),

  updateVehicle: (token: string, data: VehicleUpdateRequest) =>
    apiRequest<ApiResponse<UserProfile>>("/users/me/vehicle", {
      method: "PATCH",
      token,
      body: data,
    }),

  withdraw: (token: string, data: WithdrawRequest) =>
    apiRequest<ApiResponse<null>>("/users/me", {
      method: "DELETE",
      token,
      body: data,
    }),
};

export const parkingLotApi = {
  getList: (dong?: string) =>
    apiRequest<ApiResponse<ParkingLot[]>>(
      `/parking-lots${dong ? `?dong=${encodeURIComponent(dong)}` : ""}`
    ),

  getDetail: (id: number) =>
    apiRequest<ApiResponse<ParkingLot>>(`/parking-lots/${id}`),

  getAvailableSpots: (parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(
      `/parking-spots/${parkingLotId}/spots/available`
    ),

  getAllSpots: (parkingLotId: number) =>
    apiRequest<ApiResponse<ParkingSpot[]>>(
      `/parking-spots/${parkingLotId}/spots`
    ),
};

export const reservationApi = {
  getList: (token: string, status?: ReservationStatus) =>
    apiRequest<ApiResponse<Reservation[]>>(
      `/reservations${status ? `?status=${status}` : ""}`,
      { token }
    ),

  getDetail: (token: string, id: number) =>
    apiRequest<ApiResponse<Reservation>>(`/reservations/${id}`, { token }),

  create: (token: string, data: CreateReservationRequest) =>
    apiRequest<ApiResponse<Reservation>>("/reservations", {
      method: "POST",
      token,
      body: data,
    }),

  cancel: (token: string, id: number) =>
    apiRequest<ApiResponse<null>>(`/reservations/${id}/cancel`, {
      method: "PATCH",
      token,
    }),
};

export const paymentApi = {
  start: (token: string, data: CreatePaymentRequest) =>
    apiRequest<ApiResponse<Payment>>("/payments", {
      method: "POST",
      token,
      body: data,
    }),

  approve: (token: string, paymentId: number) =>
    apiRequest<ApiResponse<Payment>>(`/payments/${paymentId}/approve`, {
      method: "POST",
      token,
    }),
};
