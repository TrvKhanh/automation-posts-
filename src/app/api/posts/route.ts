import { NextRequest, NextResponse } from 'next/server';
import { db, PostRecord } from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    let query = `SELECT * FROM posts`;
    const params: any[] = [];

    if (q) {
      query += ` WHERE title LIKE ? OR content LIKE ? OR chapters LIKE ?`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const posts = db.prepare(query).all(...params) as PostRecord[];

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, media_urls, book_link, chapters } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Tên cuốn sách là bắt buộc' },
        { status: 400 }
      );
    }

    const id = `post-${crypto.randomUUID().slice(0, 8)}`;
    const mediaStr = typeof media_urls === 'string' ? media_urls : JSON.stringify(media_urls || []);
    const chaptersStr = typeof chapters === 'string' ? chapters : JSON.stringify(chapters || []);

    db.prepare(`
      INSERT INTO posts (id, title, content, media_urls, book_link, chapters, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      id,
      title,
      content || `Nội dung chia sẻ sách: ${title}`,
      mediaStr,
      book_link || '',
      chaptersStr
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, media_urls, book_link, chapters } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID bài viết' }, { status: 400 });
    }

    const mediaStr = typeof media_urls === 'string' ? media_urls : JSON.stringify(media_urls || []);
    const chaptersStr = typeof chapters === 'string' ? chapters : JSON.stringify(chapters || []);

    db.prepare(`
      UPDATE posts
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          media_urls = COALESCE(?, media_urls),
          book_link = COALESCE(?, book_link),
          chapters = COALESCE(?, chapters),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, mediaStr, book_link, chaptersStr, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID bài viết cần xóa' }, { status: 400 });
    }

    db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
