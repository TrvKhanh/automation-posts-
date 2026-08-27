'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderGit2,
  PlayCircle,
  History,
  Bot,
  Sparkles,
  Layers,
} from 'lucide-react';

const navItems = [
  {
    name: 'Tổng quan (Dashboard)',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'GPM Profiles',
    href: '/profiles',
    icon: Users,
  },
  {
    name: 'Soạn Bài viết (Spintax)',
    href: '/posts',
    icon: FileText,
  },
  {
    name: 'Quản lý FB Groups',
    href: '/groups',
    icon: FolderGit2,
  },
  {
    name: 'Chiến dịch Đăng bài',
    href: '/campaigns',
    icon: PlayCircle,
  },
  {
    name: 'Nhật ký Hoạt động',
    href: '/logs',
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 font-sans">
      <div>
        {/* Header / Brand */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">
                GPM FB Auto
              </h1>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-600" /> Studio Light Edition
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-900 font-semibold border border-amber-300/50'
                    : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-amber-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-[11px] font-medium text-slate-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Studio Light
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-semibold text-[10px]">
            v2.0 Clean
          </span>
        </div>
      </div>
    </aside>
  );
}
