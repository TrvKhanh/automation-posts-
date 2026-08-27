import { NextResponse } from 'next/server';
import { db, LogRecord } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const campaignId = searchParams.get('campaignId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (campaignId) {
      whereClauses.push(`l.campaign_id = ?`);
      params.push(campaignId);
    }

    if (status) {
      whereClauses.push(`l.status = ?`);
      params.push(status);
    }

    if (q) {
      whereClauses.push(`(l.group_url LIKE ? OR l.profile_id LIKE ? OR l.post_url LIKE ? OR p.name LIKE ? OR g.name LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow: any = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM logs l 
        LEFT JOIN profiles p ON l.profile_id = p.id 
        LEFT JOIN groups g ON l.group_id = g.id
        ${whereSql}
      `)
      .get(...params);
    const total = countRow?.count || 0;

    const logs = db
      .prepare(`
        SELECT 
          l.*, 
          p.name as profile_name,
          COALESCE(g.name, l.group_url) as group_name,
          COALESCE(g.group_url, l.group_url) as group_url
        FROM logs l 
        LEFT JOIN profiles p ON l.profile_id = p.id 
        LEFT JOIN groups g ON l.group_id = g.id
        ${whereSql} 
        ORDER BY l.executed_at DESC 
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset) as any[];

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
