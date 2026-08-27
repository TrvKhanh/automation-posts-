'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Users, RefreshCw, CheckCircle2, AlertCircle, Shield, Search, UserCheck, Plus, X, Key, Cookie } from 'lucide-react';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'cookie' | 'uid'>('cookie');
  const [createForm, setCreateForm] = useState({ name: '', cookie: '', uid: '', pass: '', twoFa: '' });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gpm/profiles');
      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSyncGpm = async () => {
    setSyncing(true);
    try {
      await fetchProfiles();
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return alert('Vui lòng nhập tên Profile');
    
    setCreating(true);
    try {
      const res = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          loginMethod,
          credentials: {
            cookie: createForm.cookie,
            uid: createForm.uid,
            pass: createForm.pass,
            twoFa: createForm.twoFa
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã tạo và đang đăng nhập Profile tự động. Vui lòng chờ trình duyệt đóng lại!');
        setIsModalOpen(false);
        setCreateForm({ name: '', cookie: '', uid: '', pass: '', twoFa: '' });
        fetchProfiles();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e: any) {
      alert('Lỗi hệ thống: ' + e.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.gpm_id.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Quản lý GPM Login Profiles" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Danh sách Profiles Facebook</h3>
              <p className="text-xs text-slate-500">Đồng bộ tự động từ GPM Login app qua API port 19995</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên Nick / Profile ID..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition flex items-center gap-2 shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Profile FB</span>
            </button>

            <button
              onClick={handleSyncGpm}
              disabled={syncing}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition flex items-center gap-2 shrink-0 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Đồng bộ GPM</span>
            </button>
          </div>
        </div>

        {/* Profiles Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Hiển thị {filteredProfiles.length} / {profiles.length} profiles
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Sẵn sàng hoạt động
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Tên Profile (Nick FB)</th>
                <th className="px-5 py-3.5">GPM Profile ID</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ghi chú</th>
                <th className="px-5 py-3.5 text-right">Ngày đồng bộ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Đang đồng bộ danh sách Profile từ GPM Login...
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy Profile nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs border border-amber-200">
                        {p.name.slice(0, 1)}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{p.gpm_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {p.status || 'Ready'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{p.notes || 'Dữ liệu SQLite'}</td>
                    <td className="px-5 py-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : 'Mới'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                Thêm Profile & Đăng nhập FB
              </h3>
              <button onClick={() => !creating && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="p-5 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 block">Tên Profile (GPM)</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: Clone 01 - Nguyen Van A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-medium text-slate-700 block">Phương thức đăng nhập ngầm</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('cookie')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border font-medium transition ${loginMethod === 'cookie' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Cookie className="w-4 h-4" /> Bơm Cookie
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('uid')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border font-medium transition ${loginMethod === 'uid' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Key className="w-4 h-4" /> UID | Pass | 2FA
                  </button>
                </div>
              </div>

              {loginMethod === 'cookie' ? (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="font-medium text-slate-700 block text-xs">Facebook Cookie</label>
                  <textarea
                    required
                    value={createForm.cookie}
                    onChange={e => setCreateForm(f => ({ ...f, cookie: e.target.value }))}
                    placeholder="c_user=1000...; xs=...;"
                    className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white text-xs font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700 block text-xs">UID Facebook</label>
                    <input
                      required
                      type="text"
                      value={createForm.uid}
                      onChange={e => setCreateForm(f => ({ ...f, uid: e.target.value }))}
                      placeholder="1000xxxxxxxx"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700 block text-xs">Mật khẩu</label>
                    <input
                      required
                      type="password"
                      value={createForm.pass}
                      onChange={e => setCreateForm(f => ({ ...f, pass: e.target.value }))}
                      placeholder="Mật khẩu Facebook"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-700 block text-xs">Mã 2FA (Bỏ trống nếu không có)</label>
                    <input
                      type="text"
                      value={createForm.twoFa}
                      onChange={e => setCreateForm(f => ({ ...f, twoFa: e.target.value }))}
                      placeholder="Mã bảo mật 32 ký tự (nếu có)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-slate-50 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {creating ? 'Đang tạo & Login...' : 'Tạo Profile GPM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
