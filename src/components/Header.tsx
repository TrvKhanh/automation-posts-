'use client';

import { useEffect, useState } from 'react';
import { Wifi, Clock, Activity } from 'lucide-react';

export function Header({ title }: { title: string }) {
  const [time, setTime] = useState<string>('');
  const [gpmStatus, setGpmStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkGpm = async () => {
      try {
        const res = await fetch('/api/gpm/profiles');
        if (res.ok) {
          setGpmStatus('online');
        } else {
          setGpmStatus('offline');
        }
      } catch (e) {
        setGpmStatus('offline');
      }
    };

    checkGpm();
    const gpmInterval = setInterval(checkGpm, 15000);
    return () => clearInterval(gpmInterval);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>

      {/* Badges / Status */}
      <div className="flex items-center gap-3 text-xs">
        {/* Realtime Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time || '--:--:--'}</span>
        </div>

        {/* GPM Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs border transition-colors ${
            gpmStatus === 'online'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : gpmStatus === 'offline'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                gpmStatus === 'online'
                  ? 'bg-emerald-400'
                  : gpmStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                gpmStatus === 'online'
                  ? 'bg-emerald-500'
                  : gpmStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-semibold">
            {gpmStatus === 'online'
              ? 'GPM API Connected (Port 19995)'
              : gpmStatus === 'offline'
              ? 'GPM Disconnected'
              : 'Đang kiểm tra...'}
          </span>
        </div>
      </div>
    </header>
  );
}
