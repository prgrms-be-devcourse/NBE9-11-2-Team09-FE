"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  authApi,
  VEHICLE_TYPE_OPTIONS,
  type UserProfile,
  type VehicleType,
} from "@/lib/api";

export default function MyPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SMALL");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      if (!user?.accessToken) {
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setPageError("");

        const response = await authApi.getProfile(user.accessToken);

        if (cancelled) return;

        setProfile(response.data);
        setPlateNumber(response.data.plateNumber ?? "");
        setVehicleType(response.data.vehicleType ?? "SMALL");
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "내 정보를 불러오지 못했습니다.";

        if (message.includes("인증이 만료")) {
          await logout();
          router.replace("/login");
          return;
        }

        setPageError(message);
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    if (!isLoading && user?.accessToken) {
      void fetchProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [isLoading, user?.accessToken]);

  const profileInitial = useMemo(() => {
    return profile?.userName?.charAt(0) || "U";
  }, [profile?.userName]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");

    if (profile) {
      setPlateNumber(profile.plateNumber ?? "");
      setVehicleType(profile.vehicleType ?? "SMALL");
    }
  };

  const handleSave = async () => {
    if (!user?.accessToken || !profile) return;

    if (!plateNumber.trim()) {
      setSaveError("차량번호를 입력해주세요.");
      setSaveSuccess("");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess("");

      const response = await authApi.updateVehicle(user.accessToken, {
        plateNumber,
        vehicleType,
      });

      setProfile(response.data);
      setPlateNumber(response.data.plateNumber);
      setVehicleType(response.data.vehicleType);
      setIsEditing(false);
      setSaveSuccess("차량 정보 수정이 완료되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "차량 정보 수정에 실패했습니다.";

      if (message.includes("인증이 만료")) {
        await logout();
        router.replace("/login");
        return;
      }

      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const openWithdrawModal = () => {
    setWithdrawPassword("");
    setWithdrawError("");
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    if (withdrawing) return;
    setShowWithdrawModal(false);
    setWithdrawPassword("");
    setWithdrawError("");
  };

  const handleWithdraw = async () => {
    if (!user?.accessToken) return;

    if (!withdrawPassword.trim()) {
      setWithdrawError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setWithdrawing(true);
      setWithdrawError("");

      await authApi.withdraw(user.accessToken, {
        password: withdrawPassword,
      });

      await logout();
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "회원탈퇴에 실패했습니다.";

      if (message.includes("인증이 만료")) {
        await logout();
        router.replace("/login");
        return;
      }

      setWithdrawError(message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#eef5ff]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (pageError) {
    return (
      <div className="min-h-screen bg-[#eef5ff]">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.10)]">
            <h1 className="text-3xl font-extrabold text-slate-900">내 프로필</h1>
            <p className="mt-4 text-slate-600">{pageError}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#eef5ff]">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.10)]">
            <h1 className="text-3xl font-extrabold text-slate-900">내 프로필</h1>
            <p className="mt-4 text-slate-600">내 정보를 불러오지 못했습니다.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef5ff]">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-white px-6 py-3 text-lg font-bold text-blue-600 shadow-sm">
            마이페이지
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900">
            내 프로필
          </h1>
          <p className="mt-4 text-xl text-slate-500">
            회원 정보와 차량 정보를 확인하고 필요한 경우 수정할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
          <section className="rounded-[36px] border border-blue-100 bg-white p-10 shadow-[0_20px_60px_rgba(59,130,246,0.10)]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-6xl font-extrabold text-white">
                {profileInitial}
              </div>

              <h2 className="mt-8 text-5xl font-extrabold text-slate-900">
                {profile.userName}
              </h2>

              <p className="mt-4 text-2xl text-slate-500">{profile.userEmail}</p>

              <span className="mt-8 rounded-full bg-emerald-100 px-6 py-3 text-2xl font-bold text-emerald-700">
                ACTIVE
              </span>
            </div>
          </section>

          <section className="rounded-[36px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.10)]">
            <h2 className="mb-8 text-4xl font-extrabold text-slate-900">
              기본 정보
            </h2>

            <div className="space-y-5">
              <Input
                label="이름"
                value={profile.userName}
                disabled
                className="h-16 rounded-[24px] border-[#dbe7ff] bg-slate-50 px-6 text-xl font-bold text-slate-900 disabled:opacity-100"
              />

              <Input
                label="이메일"
                value={profile.userEmail}
                disabled
                className="h-16 rounded-[24px] border-[#dbe7ff] bg-slate-50 px-6 text-xl font-bold text-slate-900 disabled:opacity-100"
              />

              <Input
                label="차량번호"
                value={plateNumber}
                onChange={(e) => {
                  setPlateNumber(e.target.value);
                  setSaveError("");
                  setSaveSuccess("");
                }}
                disabled={!isEditing}
                className="h-16 rounded-[24px] border-[#dbe7ff] bg-slate-50 px-6 text-xl font-bold text-slate-900 disabled:opacity-100"
              />

              <Select
                label="차량종류"
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value as VehicleType);
                  setSaveError("");
                  setSaveSuccess("");
                }}
                options={VEHICLE_TYPE_OPTIONS}
                disabled={!isEditing}
                className="h-16 rounded-[24px] border-[#dbe7ff] bg-slate-50 px-6 text-xl font-bold text-slate-900 disabled:opacity-100"
              />

              <Input
                label="회원상태"
                value="ACTIVE"
                disabled
                className="h-16 rounded-[24px] border-[#dbe7ff] bg-slate-50 px-6 text-xl font-bold text-slate-900 disabled:opacity-100"
              />

              {saveError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-600">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-base text-blue-700">
                  {saveSuccess}
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-4">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setSaveError("");
                      setSaveSuccess("");
                    }}
                    className="rounded-[20px] bg-blue-600 px-8 py-6 text-lg font-bold text-white hover:bg-blue-700"
                  >
                    차량 정보 수정
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-[20px] bg-blue-600 px-8 py-6 text-lg font-bold text-white hover:bg-blue-700"
                    >
                      {saving ? "저장 중..." : "저장"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-[20px] px-8 py-6 text-lg font-bold"
                    >
                      취소
                    </Button>
                  </>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-[20px] px-8 py-6 text-lg font-bold"
                >
                  로그아웃
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={openWithdrawModal}
                  className="rounded-[20px] px-8 py-6 text-lg font-bold"
                >
                  회원탈퇴
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-red-100 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <TriangleAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    회원탈퇴
                  </h3>
                  <p className="text-sm text-slate-500">
                    비밀번호를 다시 입력해주세요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWithdrawModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={withdrawPassword}
                onChange={(e) => {
                  setWithdrawPassword(e.target.value);
                  setWithdrawError("");
                }}
                error={withdrawError}
                className="h-14 rounded-2xl border-red-100 bg-slate-50 px-5"
              />

              <p className="text-sm text-slate-500">
                탈퇴 후 계정 정보는 복구할 수 없습니다.
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeWithdrawModal}
                  disabled={withdrawing}
                  className="flex-1 rounded-2xl"
                >
                  취소
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 rounded-2xl"
                >
                  {withdrawing ? "처리 중..." : "탈퇴 확인"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
