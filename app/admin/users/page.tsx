"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminUserApi } from "@/lib/api";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (kw = keyword, p = page) => {
    if (!user?.accessToken) return;
    setLoading(true);
    try {
      const res = await adminUserApi.getList(user.accessToken, kw, p);
      setUsers(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [user, page]);

  const handleSearch = () => {
    setKeyword(inputValue);
    setPage(0);
    fetchUsers(inputValue, 0);
  };

  const VEHICLE_LABELS: Record<string, string> = { SMALL: "경차", LARGE: "대형", ELECTRIC: "전기차" };
  const STATUS_LABELS: Record<string, string> = { ACTIVE: "활성", WITHDRAW: "탈퇴" };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">회원 관리</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="이름 또는 이메일로 검색"
            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#2563eb]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 h-10 bg-[#2563eb] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8]"
        >
          검색
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["ID", "이름", "이메일", "차량번호", "차종", "상태", "가입일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-slate-400">회원이 없습니다.</td></tr>
            ) : users.map((u) => (
              <tr key={u.userId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{u.userId}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{u.userName}</td>
                <td className="px-4 py-3 text-slate-600">{u.userEmail}</td>
                <td className="px-4 py-3 text-slate-600">{u.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{VEHICLE_LABELS[u.vehicleType] ?? u.vehicleType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.userStatus === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {STATUS_LABELS[u.userStatus] ?? u.userStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(u.createdTime).toLocaleDateString("ko-KR")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}