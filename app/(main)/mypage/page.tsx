"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { authApi, VEHICLE_TYPE_OPTIONS, type VehicleType } from "@/lib/api";
import { User, Mail, Car, Edit2, Save, X, LogOut, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MyPage() {
  const router = useRouter();
  const { user, profile, logout, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SMALL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (profile) {
      setPlateNumber(profile.plateNumber ?? "");
      setVehicleType(profile.vehicleType ?? "SMALL");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.accessToken) return;
    setSaving(true); setError(null);
    try {
      // PATCH /api/users/me/vehicle { plateNumber, vehicleType }
      await authApi.updateVehicle(user.accessToken, { plateNumber, vehicleType });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally { setSaving(false); }
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const handleWithdraw = async () => {
    if (!user?.accessToken || !withdrawPassword) return;
    setWithdrawing(true); setError(null);
    try {
      // DELETE /api/users/me { password }
      await authApi.withdraw(user.accessToken, { password: withdrawPassword });
      await logout();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴에 실패했습니다.");
    } finally { setWithdrawing(false); }
  };

  if (!profile) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">마이페이지</h1>

        {/* 프로필 */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              {/* UserProfileResDto: userName */}
              <h2 className="text-xl font-semibold text-foreground">{profile.userName}</h2>
              <p className="text-sm text-muted-foreground">{profile.userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div><p className="text-sm text-muted-foreground">이메일</p><p className="text-foreground">{profile.userEmail}</p></div>
          </div>
        </div>

        {/* 차량 정보 */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">차량 정보</h3>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />수정
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={saving}
                  onClick={() => { setIsEditing(false); setPlateNumber(profile.plateNumber ?? ""); setVehicleType(profile.vehicleType ?? "SMALL"); }}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />저장</>}
                </Button>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          {isEditing ? (
            <div className="space-y-4">
              <Input label="차량 번호" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="12가 3456" />
              {/* VehicleType: SMALL(경차) | LARGE(대형차) | ELECTRIC(전기차) */}
              <Select label="차량 종류" value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)} options={VEHICLE_TYPE_OPTIONS} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-muted-foreground" />
                <div><p className="text-sm text-muted-foreground">차량 번호</p><p className="text-foreground">{profile.plateNumber || "-"}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">차량 종류</p>
                  <p className="text-foreground">{VEHICLE_TYPE_OPTIONS.find(v => v.value === profile.vehicleType)?.label ?? "-"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 예약 내역 바로가기 */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <Link href="/reservations">
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">내 예약 내역</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />로그아웃
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowWithdrawModal(true)}>
            <AlertTriangle className="w-5 h-5 mr-3" />회원 탈퇴
          </Button>
        </div>
      </main>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">회원 탈퇴</h3>
                <p className="text-sm text-muted-foreground">정말 탈퇴하시겠습니까?</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">모든 예약 내역과 개인정보가 삭제됩니다.</p>
            <Input type="password" label="비밀번호 확인" value={withdrawPassword}
              onChange={e => setWithdrawPassword(e.target.value)} placeholder="비밀번호를 입력하세요" />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" disabled={withdrawing}
                onClick={() => { setShowWithdrawModal(false); setWithdrawPassword(""); setError(null); }}>취소</Button>
              <Button variant="destructive" className="flex-1" onClick={handleWithdraw} disabled={withdrawing || !withdrawPassword}>
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "탈퇴하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
