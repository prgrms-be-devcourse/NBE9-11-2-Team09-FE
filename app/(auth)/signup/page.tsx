"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { authApi, VEHICLE_TYPE_OPTIONS, type VehicleType } from "@/lib/api";
import { Car, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SMALL");

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.checkEmail(email);

      // response.data === true  → 사용가능
      // response.data === false → 사용불가
      if (response.available === false) {
        setError("이미 사용 중인 이메일입니다.");
        return;   // finally에서 setIsLoading(false) 실행 후 종료
      }

      setStep(2);  // 사용 가능할 때만 다음 단계로
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("연결할 수 없습니다")) {
          setError("백엔드 서버가 실행되지 않았습니다. 서버를 먼저 시작해주세요.");
        } else {
          setError(err.message);
        }
      } else {
        setError("이메일 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!plateNumber.trim()) {
      setError("차량 번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await signup({ email, password, name, plateNumber, vehicleType });
      router.push("/parking-lots");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("연결할 수 없습니다")) {
          setError("백엔드 서버가 실행되지 않았습니다. 서버를 먼저 시작해주세요.");
        } else {
          setError(err.message);
        }
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-foreground" />
          </div>
          <span className="text-xl font-semibold">ParkEasy</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-balance">
            지금 가입하고<br />편리한 주차를<br />경험하세요
          </h1>
          <p className="text-muted-foreground text-lg">
            주변 주차장 실시간 현황 확인부터<br />
            예약, 결제까지 한 번에 해결하세요.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">ParkEasy 2025. All rights reserved.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-semibold">ParkEasy</span>
          </div>

          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setError(""); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전 단계
            </button>
          )}

          <div className="flex gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-foreground" : "bg-border"}`} />
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {step === 1 ? "계정 정보" : "개인 및 차량 정보"}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 ? "로그인에 사용할 이메일과 비밀번호를 입력하세요." : "이름과 차량 정보를 입력하세요."}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <Input label="이메일" type="email" placeholder="example@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="비밀번호" type="password" placeholder="8자 이상 입력하세요"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Input label="비밀번호 확인" type="password" placeholder="비밀번호를 다시 입력하세요"
                value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}

              {/* ✅ isLoading 추가 — 이메일 중복 확인 중 버튼 비활성화 */}
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "이메일 확인 중..." : "다음"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <Input label="이름" type="text" placeholder="홍길동"
                value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="차량 번호" type="text" placeholder="12가 3456"
                value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required />
              <Select label="차종" value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                options={VEHICLE_TYPE_OPTIONS} />

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? "가입 중..." : "회원가입 완료"}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-foreground underline">로그인</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}