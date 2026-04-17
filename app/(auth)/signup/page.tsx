"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { VEHICLE_TYPE_OPTIONS, type VehicleType } from "@/lib/api";

type Step1Errors = {
  userEmail?: string;
  password?: string;
  passwordConfirm?: string;
};

type Step2Errors = {
  name?: string;
  plateNumber?: string;
  vehicleType?: string;
  submit?: string;
};

type EmailCheckResponse = {
  available: boolean;
  message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const router = useRouter();
  const { user, signup, isLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SMALL");

  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  const isStep1ValidForCheck = useMemo(() => {
    return EMAIL_REGEX.test(userEmail.trim());
  }, [userEmail]);

  const resetEmailCheckState = () => {
    setEmailChecked(false);
    setEmailAvailable(false);
    setEmailCheckMessage("");
  };

  const validateStep1 = () => {
    const errors: Step1Errors = {};

    if (!userEmail.trim()) {
      errors.userEmail = "이메일을 입력해주세요.";
    } else if (!EMAIL_REGEX.test(userEmail)) {
      errors.userEmail = "올바른 이메일 형식이 아닙니다.";
    }

    if (!password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (password.length < 8) {
      errors.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    if (!emailChecked || !emailAvailable) {
      errors.userEmail = errors.userEmail || "이메일 중복 확인을 완료해주세요.";
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Step2Errors = {};

    if (!name.trim()) {
      errors.name = "이름을 입력해주세요.";
    }

    if (!plateNumber.trim()) {
      errors.plateNumber = "차량번호를 입력해주세요.";
    }

    if (!vehicleType) {
      errors.vehicleType = "차량종류를 선택해주세요.";
    }

    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckEmail = async () => {
    const nextErrors: Step1Errors = {};

    if (!userEmail.trim()) {
      nextErrors.userEmail = "이메일을 입력해주세요.";
      setStep1Errors(nextErrors);
      return;
    }

    if (!EMAIL_REGEX.test(userEmail)) {
      nextErrors.userEmail = "올바른 이메일 형식이 아닙니다.";
      setStep1Errors(nextErrors);
      return;
    }

    setCheckingEmail(true);
    setEmailCheckMessage("");
    setStep1Errors((prev) => ({ ...prev, userEmail: undefined }));

    try {
      const response = await fetch(
        `/api/users/check-email?email=${encodeURIComponent(userEmail)}`,
        { method: "GET" }
      );

      const data = (await response.json()) as EmailCheckResponse;

      if (!response.ok) {
        setEmailChecked(false);
        setEmailAvailable(false);
        setEmailCheckMessage("");
        setStep1Errors((prev) => ({
          ...prev,
          userEmail: data.message || "이메일 중복 확인에 실패했습니다.",
        }));
        return;
      }

      setEmailChecked(true);
      setEmailAvailable(data.available);
      setEmailCheckMessage(data.message);

      if (!data.available) {
        setStep1Errors((prev) => ({
          ...prev,
          userEmail: data.message || "이미 사용 중인 이메일입니다.",
        }));
        return;
      }

      setStep1Errors((prev) => ({
        ...prev,
        userEmail: undefined,
      }));
    } catch {
      setEmailChecked(false);
      setEmailAvailable(false);
      setEmailCheckMessage("");
      setStep1Errors((prev) => ({
        ...prev,
        userEmail: "이메일 중복 확인 중 오류가 발생했습니다.",
      }));
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateStep1()) return;

    setStep(2);
  };

  const handlePrev = () => {
    setStep2Errors({});
    setStep(1);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setSubmitting(true);
    setStep2Errors({});

    try {
      await signup({
        email: userEmail,
        password,
        name,
        plateNumber,
        vehicleType,
      });

      router.push("/");
    } catch (error) {
      setStep2Errors({
        submit:
          error instanceof Error
            ? error.message
            : "회원가입에 실패했습니다. 다시 시도해주세요.",
      });
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

            <div className="mb-8 grid grid-cols-2 rounded-2xl bg-[#eaf1ff] p-2">
              <Link
                href="/login"
                className="flex h-14 items-center justify-center rounded-xl text-xl font-bold text-slate-500 transition hover:text-blue-600"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="flex h-14 items-center justify-center rounded-xl bg-white text-xl font-bold text-blue-600 shadow-sm"
              >
                회원가입
              </Link>
            </div>

            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                회원가입
              </h2>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
                {step}/2
              </span>
            </div>

            <div className="mb-8 flex gap-3">
              <div
                className={`h-2 flex-1 rounded-full ${
                  step >= 1 ? "bg-blue-600" : "bg-[#dbe7ff]"
                }`}
              />
              <div
                className={`h-2 flex-1 rounded-full ${
                  step >= 2 ? "bg-blue-600" : "bg-[#dbe7ff]"
                }`}
              />
            </div>

            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="space-y-3">
                  <Input
                    label="이메일"
                    type="email"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      resetEmailCheckState();
                      setStep1Errors((prev) => ({
                        ...prev,
                        userEmail: undefined,
                      }));
                    }}
                    error={step1Errors.userEmail}
                    required
                    className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 w-full rounded-2xl border-[#cfe0ff] text-lg font-bold text-blue-600 hover:bg-blue-50"
                    onClick={handleCheckEmail}
                    disabled={checkingEmail || !isStep1ValidForCheck}
                  >
                    {checkingEmail ? "확인 중..." : "중복 확인"}
                  </Button>

                  {emailChecked && emailAvailable && (
                    <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{emailCheckMessage || "사용 가능한 이메일입니다."}</span>
                    </div>
                  )}
                </div>

                <Input
                  label="비밀번호"
                  type="password"
                  placeholder="8자 이상 입력"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setStep1Errors((prev) => ({
                      ...prev,
                      password: undefined,
                      passwordConfirm: undefined,
                    }));
                  }}
                  error={step1Errors.password}
                  required
                  className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
                />

                <Input
                  label="비밀번호 확인"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    setStep1Errors((prev) => ({
                      ...prev,
                      passwordConfirm: undefined,
                    }));
                  }}
                  error={step1Errors.passwordConfirm}
                  required
                  className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
                />

                <Button
                  type="submit"
                  className="h-16 w-full rounded-2xl bg-blue-600 text-xl font-bold text-white hover:bg-blue-700"
                >
                  다음
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSignup} className="space-y-6">
                <Input
                  label="이름"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStep2Errors((prev) => ({
                      ...prev,
                      name: undefined,
                    }));
                  }}
                  error={step2Errors.name}
                  required
                  className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
                />

                <Input
                  label="차량번호"
                  type="text"
                  placeholder="12가3456"
                  value={plateNumber}
                  onChange={(e) => {
                    setPlateNumber(e.target.value);
                    setStep2Errors((prev) => ({
                      ...prev,
                      plateNumber: undefined,
                    }));
                  }}
                  error={step2Errors.plateNumber}
                  required
                  className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg placeholder:text-slate-400 focus-visible:ring-blue-500"
                />

                <div>
                  <Select
                    label="차량종류"
                    value={vehicleType}
                    onChange={(e) => {
                      setVehicleType(e.target.value as VehicleType);
                      setStep2Errors((prev) => ({
                        ...prev,
                        vehicleType: undefined,
                      }));
                    }}
                    options={VEHICLE_TYPE_OPTIONS}
                    className="h-16 rounded-2xl border-[#dbe7ff] bg-slate-50 px-5 text-lg focus-visible:ring-blue-500"
                  />
                  {step2Errors.vehicleType && (
                    <p className="mt-1 text-xs text-destructive">
                      {step2Errors.vehicleType}
                    </p>
                  )}
                </div>

                {step2Errors.submit && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {step2Errors.submit}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 flex-1 rounded-2xl border-[#cfe0ff] text-lg font-bold text-blue-600 hover:bg-blue-50"
                    onClick={handlePrev}
                  >
                    이전
                  </Button>

                  <Button
                    type="submit"
                    className="h-16 flex-1 rounded-2xl bg-blue-600 text-lg font-bold text-white hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? "회원가입 중..." : "회원가입"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
