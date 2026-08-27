import { NextResponse } from 'next/server';
import { db, GroupRecord } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const groups = db.prepare(`SELECT * FROM groups ORDER BY created_at DESC`).all() as GroupRecord[];
    return NextResponse.json({ success: true, groups });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urls, category = 'General' } = body;

    if (!urls) {
      return NextResponse.json({ success: false, error: 'Thiếu danh sách URL Group' }, { status: 400 });
    }

    let rawLines: string[] = [];
    if (Array.isArray(urls)) {
      rawLines = urls.map((l: any) => String(l).trim()).filter((l: string) => l.length > 0);
    } else if (typeof urls === 'string') {
      rawLines = urls.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    }

    const insertStmt = db.prepare(`
      INSERT INTO groups (id, name, group_url, group_id_fb, category)
      VALUES (?, ?, ?, ?, ?)
    `);

    let addedCount = 0;
    for (const line of rawLines) {
      let cleanUrl = line;
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://www.facebook.com/groups/${cleanUrl}/`;
      }

      // Ensure trailing slash for group url
      if (cleanUrl.includes('facebook.com/groups/') && !cleanUrl.endsWith('/')) {
        cleanUrl += '/';
      }

      // Extract group ID or slug
      const match = cleanUrl.match(/facebook\.com\/groups\/([^\/?#]+)/);
      const groupFbId = match ? match[1] : '';
      const groupName = groupFbId ? `FB Group (${groupFbId})` : cleanUrl;

      insertStmt.run(`grp-${crypto.randomUUID().slice(0, 8)}`, groupName, cleanUrl, groupFbId, category);
      addedCount++;
    }

    return NextResponse.json({ success: true, addedCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Thiếu ID Group' }, { status: 400 });

    db.prepare(`DELETE FROM groups WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
