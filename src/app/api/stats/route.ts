import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const totalPosts = (db.prepare(`SELECT COUNT(*) as count FROM posts`).get() as any).count;
    const totalGroups = (db.prepare(`SELECT COUNT(*) as count FROM groups`).get() as any).count;
    const totalProfiles = (db.prepare(`SELECT COUNT(*) as count FROM profiles`).get() as any).count;
    const activeCampaigns = (db.prepare(`SELECT COUNT(*) as count FROM campaigns WHERE status = 'running'`).get() as any).count;
    
    const totalLogs = (db.prepare(`SELECT COUNT(*) as count FROM logs`).get() as any).count;
    const successLogs = (db.prepare(`SELECT COUNT(*) as count FROM logs WHERE status = 'success'`).get() as any).count;
    const errorLogs = (db.prepare(`SELECT COUNT(*) as count FROM logs WHERE status = 'error'`).get() as any).count;

    const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts,
        totalGroups,
        totalProfiles,
        activeCampaigns,
        totalLogs,
        successLogs,
        errorLogs,
        successRate,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
