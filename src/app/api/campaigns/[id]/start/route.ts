import { NextResponse } from 'next/server';
import { runCampaign } from '@/lib/automation/runner';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID chiến dịch' }, { status: 400 });
    }

    // Trigger async execution
    runCampaign(id).catch((e) => console.error(`Error running campaign ${id}:`, e));

    return NextResponse.json({ success: true, message: 'Đã kích hoạt chạy chiến dịch' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
