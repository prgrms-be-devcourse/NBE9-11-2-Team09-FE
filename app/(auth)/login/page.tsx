"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();

  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      await login(userEmail, password);
      router.push("/");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "로그인에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <section className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-12 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Car className="h-6 w-6" />
            </div>
            <span className="text-xl font-semibold">ParkEasy</span>
          </div>

          <div className="max-w-md">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-sky-100">
              Public Parking Reservation
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              가까운 공영주차장을
              <br />
              더 빠르게 예약하세요
            </h1>
            <p className="mt-5 text-base leading-7 text-sky-50/90">
              로그인 후 주차장 조회, 예약, 프로필 관리까지 한 번에 이용할 수
              있습니다.
            </p>
          </div>

          <p className="text-sm text-sky-100/80">
            ParkEasy parking service
          </p>
        </section>

        <section className="flex w-full items-center justify-center bg-[#eef4ff] px-6 py-12 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-xl rounded-[32px] border border-[#dbe7ff] bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.12)] sm:p-10">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500 to-sky-400 shadow-[0_10px_30px_rgba(59,130,246,0.24)]">
                <span className="text-3xl font-bold text-white">P</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Parking
              </h1>
            </div>

            <div className="mb-10 grid grid-cols-2 rounded-2xl bg-[#eaf1ff] p-2">
              <Link
                href="/login"
                className="flex h-14 items-center justify-center rounded-xl bg-white text-xl font-bold text-blue-600 shadow-sm"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="flex h-14 items-center justify-center rounded-xl text-xl font-bold text-slate-500 transition hover:text-blue-600"
              >
                회원가입
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                로그인
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="이메일"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
              />

              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
              />

              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="h-16 w-full rounded-2xl bg-blue-600 text-xl font-bold text-white hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
