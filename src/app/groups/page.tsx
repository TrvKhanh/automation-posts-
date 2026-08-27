'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { FolderGit2, Plus, Search, Trash2, ExternalLink, Filter, CheckCircle2, UploadCloud } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Bulk add state
  const [groupUrlsInput, setGroupUrlsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroups = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupUrlsInput.trim()) return alert('Vui lòng dán danh sách URL Group Facebook');

    const lines = groupUrlsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: lines }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setGroupUrlsInput('');
        fetchGroups();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa FB Group này khỏi danh sách?')) return;
    try {
      await fetch(`/api/groups?id=${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchQ =
      g.name.toLowerCase().includes(q.toLowerCase()) ||
      g.group_url.toLowerCase().includes(q.toLowerCase());
    const matchCat = categoryFilter ? g.category === categoryFilter : true;
    return matchQ && matchCat;
  });

  const categories = Array.from(new Set(groups.map((g) => g.category || 'General')));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Quản lý Facebook Groups Target" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Danh sách FB Groups ({groups.length})</h3>
              <p className="text-xs text-slate-500">Lưu trữ toàn bộ Facebook Groups từ SQLite database</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên Group / URL..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="">-- Tất cả Chuyên mục --</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Thêm Groups
            </button>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Tên Group Facebook</th>
                <th className="px-5 py-3.5">Chuyên mục</th>
                <th className="px-5 py-3.5">Link Group</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Đang tải danh sách Facebook Groups...
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy Group nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs truncate">
                      {g.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                        {g.category || 'Ebook Seeding'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600 max-w-xs truncate">
                      <a
                        href={g.group_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-amber-700 hover:underline"
                      >
                        {g.group_url} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        className="text-slate-400 hover:text-rose-600 transition font-bold"
                        title="Xóa group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Groups */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" /> Nhập Hàng Loạt FB Groups
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGroups} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Danh sách URL Groups (Mỗi dòng 1 URL hoặc Tên Group)
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="https://www.facebook.com/groups/123456/&#10;https://www.facebook.com/groups/789012/"
                  value={groupUrlsInput}
                  onChange={(e) => setGroupUrlsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Thêm Vào Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
