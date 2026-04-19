"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // auth-context의 login()이 내부적으로
      // userEmail 필드명 변환 + 토큰 저장 + 프로필 로드 처리
      await login(email, password);
      router.push("/parking-lots");
    } catch (err) {
      // apiRequest에서 error.msg를 throw하므로 그대로 표시
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-foreground" />
          </div>
          <span className="text-xl font-semibold">ParkEasy</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-balance">
            스마트한 주차,
            <br />
            간편한 예약
          </h1>
          <p className="text-muted-foreground text-lg">
            가까운 주차장을 검색하고 미리 자리를 예약하세요.
            <br />
            복잡한 주차 걱정 없이 편리하게 이용할 수 있습니다.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          ParkEasy 2025. All rights reserved.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-semibold">ParkEasy</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">로그인</h2>
            <p className="text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-foreground underline">
                회원가입
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="이메일"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              로그인하면{" "}
              <Link href="#" className="underline">
                서비스 이용약관
              </Link>
              {" "}및{" "}
              <Link href="#" className="underline">
                개인정보 처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}