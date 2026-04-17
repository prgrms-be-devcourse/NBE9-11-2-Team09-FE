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

export interface SignupData {
  email: string;
  password: string;
  name: string;
  plateNumber: string;
  vehicleType: VehicleType;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TokenData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (token: string) => {
    console.log("[auth] loadProfile start", token);
    try {
      const response = await authApi.getProfile(token);
      console.log("[auth] loadProfile success", response);
      setProfile(response.data);
    } catch {
      console.log("[auth] loadProfile error");
      setProfile(null);
    }
  };

  useEffect(() => {
    console.log("[auth] initialize start");
    const stored = localStorage.getItem("auth");
    console.log("[auth] stored auth", stored);

    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      const tokens = extractTokenData(parsed);
      console.log("[auth] parsed token", parsed);

      if (!tokens) {
        throw new Error("Invalid auth payload");
      }

      setUser(tokens);
      localStorage.setItem("auth", JSON.stringify(tokens));
      setIsLoading(false);
      void loadProfile(tokens.accessToken);
    } catch {
      localStorage.removeItem("auth");
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    console.log("[auth] login start", { email });
    const response = await authApi.login({
      userEmail: email,
      password,
    });
    const tokens = response.data;
    console.log("[auth] login success", tokens);

    setUser(tokens);
    localStorage.setItem("auth", JSON.stringify(tokens));
    await loadProfile(tokens.accessToken);
  };

  const signup = async (data: SignupData) => {
    await authApi.signup({
      userEmail: data.email,
      password: data.password,
      name: data.name,
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType,
    });

    await login(data.email, data.password);
  };

  const logout = async () => {
    if (user?.accessToken) {
      try {
        await authApi.logout(user.accessToken);
      } catch {
        // 서버 로그아웃 실패와 무관하게 클라이언트 상태는 정리
      }
    }

    setUser(null);
    setProfile(null);
    localStorage.removeItem("auth");
  };

  const refreshProfile = async () => {
    if (!user?.accessToken) return;
    await loadProfile(user.accessToken);
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
