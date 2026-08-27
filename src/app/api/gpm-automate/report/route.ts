import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, status, postUrl, errorMessage } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu taskId hoặc status trong phản hồi' },
        { status: 400 }
      );
    }

    if (status === 'success') {
      db.prepare(`
        UPDATE logs
        SET status = 'success', post_url = ?, error_message = NULL
        WHERE id = ?
      `).run(postUrl || 'N/A', taskId);
    } else {
      db.prepare(`
        UPDATE logs
        SET status = 'error', error_message = ?
        WHERE id = ?
      `).run(errorMessage || 'Lỗi từ kịch bản GPM Automate', taskId);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã nhận báo cáo kết quả thành công',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
