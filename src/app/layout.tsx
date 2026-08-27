import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'GPM Facebook Group Auto-Poster (Line Art Edition)',
  description: 'Hệ thống tự động đăng bài vào FB Groups với giao diện Line Art Giấy Vàng Kẻ Ô',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="flex min-h-screen text-stone-900 antialiased font-mono selection:bg-amber-300 selection:text-stone-900">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
