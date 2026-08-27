import { NextResponse } from 'next/server';
import { db, CampaignRecord } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const campaigns = db.prepare(`SELECT * FROM campaigns ORDER BY created_at DESC`).all() as CampaignRecord[];
    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, post_id, chapter_id, profile_ids, group_ids, min_delay = 60, max_delay = 180 } = body;

    if (!name || !post_id || !profile_ids || !group_ids) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc khi tạo Chiến dịch' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO campaigns (id, name, post_id, chapter_id, profile_ids, group_ids, min_delay, max_delay, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'idle')
    `).run(
      id,
      name,
      post_id,
      chapter_id || null,
      JSON.stringify(profile_ids),
      JSON.stringify(group_ids),
      Number(min_delay),
      Number(max_delay)
    );

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Thiếu ID Chiến dịch' }, { status: 400 });

    db.prepare(`DELETE FROM campaigns WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
