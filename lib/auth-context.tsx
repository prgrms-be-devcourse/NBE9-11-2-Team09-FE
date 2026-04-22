"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  type TokenData,
  type UserProfile,
  type VehicleType,
} from "./api";

interface AuthContextType {
  user: TokenData | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// auth-context 내부에서 사용하는 회원가입 데이터 타입
// (UI에서 받아서 SignupRequest로 변환)
export interface SignupData {
  email: string;       // → userEmail
  password: string;
  name: string;
  plateNumber: string; // → plateNumber (vehicleNumber 아님)
  vehicleType: VehicleType;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TokenData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TokenData;
        setUser(parsed);
        loadProfile(parsed.accessToken);
      } catch {
        localStorage.removeItem("auth");
      }
    }
    setIsLoading(false);
  }, []);

  const loadProfile = async (token: string) => {
    try {
      // GET /api/users/me → UserProfileResDto
      const response = await authApi.getProfile(token);
      setProfile(response.data);
    } catch {
      // 토큰 만료 등 — apiRequest에서 자동 갱신 시도 후 실패 시 /login 리다이렉트
    }
  };

  const login = async (email: string, password: string) => {
    // POST /api/users/login
    // LoginReqDto: { userEmail, password }
    // LoginResDto: { accessToken, refreshToken, tokenType }
    const response = await authApi.login({
      userEmail: email,   // ← 필드명 변환
      password,
    });
    const tokens = response.data; // { accessToken, refreshToken, tokenType }
    setUser(tokens);
    localStorage.setItem("auth", JSON.stringify(tokens));
    // 토큰만 받으므로 프로필은 별도로 조회
    await loadProfile(tokens.accessToken);
  };

  const signup = async (data: SignupData) => {
    // POST /api/users/signup
    // SignupReqDto: { userEmail, password, name, plateNumber, vehicleType }
    const response = await authApi.signup({
      userEmail: data.email,        // ← 필드명 변환
      password: data.password,
      name: data.name,
      plateNumber: data.plateNumber, // ← 필드명 변환
      vehicleType: data.vehicleType,
    });
    // 회원가입 응답은 UserProfileResDto (토큰 없음)
    // → 바로 로그인 처리
    setProfile(response.data);
    await login(data.email, data.password);
  };

  const logout = async () => {
    if (user?.accessToken) {
      try {
        await authApi.logout(user.accessToken);
      } catch {
        // 서버 로그아웃 실패해도 클라이언트는 정리
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem("auth");
  };

  const refreshProfile = async () => {
    if (user?.accessToken) {
      await loadProfile(user.accessToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}