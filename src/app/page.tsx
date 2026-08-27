'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  Users,
  FolderGit2,
  FileText,
  PlayCircle,
  History,
  CheckCircle2,
  XCircle,
  Zap,
  Globe,
  User,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    profilesCount: 0,
    groupsCount: 0,
    postsCount: 0,
    activeCampaignsCount: 0,
    totalLogsCount: 0,
    successLogsCount: 0,
  });

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        const logsRes = await fetch('/api/logs?limit=10');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentLogs(logsData.logs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Tổng quan Hệ thống Seeding Facebook" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Banner Welcome */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> GPM Automation Core Engine
            </div>
            <h2 className="text-xl font-bold tracking-tight">Hệ Thống Tự Động Đăng Bài Facebook Group</h2>
            <p className="text-xs text-slate-300">
              Quản lý tài khoản GPM Login, kịch bản Spintax, danh sách Facebook Group và Nhật ký Seeding trực tiếp từ Database.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-2 shrink-0"
          >
            <PlayCircle className="w-4 h-4" /> Bắt đầu Chiến dịch
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profiles Card */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GPM Profiles</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.profilesCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Tài khoản Facebook ready</p>
            </div>
          </div>

          {/* Groups Card */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FB Groups</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.groupsCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Nhóm mục tiêu sẵn sàng</p>
            </div>
          </div>

          {/* Posts Card */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bài viết Spintax</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.postsCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Kịch bản biến thể sẵn có</p>
            </div>
          </div>

          {/* Activity Logs Card */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Bài Đã Đăng</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <History className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalLogsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {stats.successLogsCount} thành công ({Math.round((stats.successLogsCount / (stats.totalLogsCount || 1)) * 100)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Logs Full Width */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"></div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <History className="w-4 h-4" />
              </div>
              Nhật ký đăng bài
            </h3>
            <Link href="/logs" className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:text-amber-700 font-bold transition-colors shadow-xs">
              Xem tất cả nhật ký ({stats.totalLogsCount})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Group FB Target</th>
                  <th className="px-6 py-4">Tài khoản đăng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thời gian đăng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">Đang tải nhật ký...</td>
                  </tr>
                ) : recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">Chưa có nhật ký đăng bài nào.</td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/30 transition-all duration-200 group bg-white">
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <Globe className="w-4 h-4 text-indigo-500" />
                          </div>
                          {log.group_url ? (
                            <a href={log.group_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-indigo-600 truncate transition-colors" title={log.group_name || log.group_url}>
                              <span className="truncate">{log.group_name || log.group_url}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <span className="font-bold text-slate-800 truncate" title={log.group_name || 'Group FB'}>
                              {log.group_name || 'Group FB'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:border-amber-200 group-hover:bg-amber-50 transition-colors">
                          <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                          <span className="font-bold text-slate-700 group-hover:text-amber-900 truncate max-w-[150px]" title={log.profile_name || log.profile_id}>
                            {log.profile_name || log.profile_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm ring-1 ring-inset ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/30'
                              : 'bg-rose-50 text-rose-700 ring-rose-500/30'
                          }`}
                        >
                          {log.status === 'success' ? (
                            <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Thành công</>
                          ) : (
                            <><XCircle className="w-4 h-4 text-rose-500" /> Thất bại</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 font-mono text-[11px] border border-slate-100 group-hover:border-slate-200 transition-colors">
                          {new Date(log.executed_at).toLocaleString('vi-VN', { 
                            hour: '2-digit', minute: '2-digit', second: '2-digit', 
                            day: '2-digit', month: '2-digit', year: 'numeric' 
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center rounded-b-2xl">
            <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              Dữ liệu được đồng bộ trực tiếp từ SQLite Database
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
