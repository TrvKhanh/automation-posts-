'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { History, Search, CheckCircle2, XCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [q, statusFilter, page]);

  const totalCount = pagination?.total ?? logs.length ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Nhật ký Hoạt động Seeding" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Nhật ký đăng bài ({totalCount})</h3>
              <p className="text-xs text-slate-500">Lưu lại lịch sử thành công, lỗi và link post trực tiếp từ Facebook</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm URL Group, Profile..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
            >
              <option value="">-- Tất cả Trạng thái --</option>
              <option value="success">Thành công (Success)</option>
              <option value="error">Thất bại (Error)</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">FB Group Target</th>
                <th className="px-5 py-3.5">Tài khoản đăng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Link Bài Đăng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Đang tải nhật ký hoạt động từ Database...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy nhật ký hoạt động nào.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                      {log.executed_at ? new Date(log.executed_at).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs truncate">
                      {log.group_url ? (
                        <a
                          href={log.group_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-indigo-600 hover:underline transition-colors inline-flex items-center gap-1"
                          title={log.group_name || log.group_url}
                        >
                          <span className="truncate">{log.group_name || log.group_url}</span>
                        </a>
                      ) : (
                        <span title={log.group_name}>{log.group_name || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-indigo-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                        {log.profile_name || log.profile_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" /> Thất bại
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      {log.post_url ? (
                        <a
                          href={log.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-bold hover:underline"
                        >
                          Xem bài post <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không có link</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-semibold">
              Hiển thị {logs.length} / {totalCount} nhật ký (Trang {page} / {totalPages})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1 shadow-xs"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
