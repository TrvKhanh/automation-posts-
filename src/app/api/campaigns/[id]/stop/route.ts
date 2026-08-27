import { NextResponse } from 'next/server';
import { stopCampaign } from '@/lib/automation/runner';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID chiến dịch' }, { status: 400 });
    }

    stopCampaign(id);

    return NextResponse.json({ success: true, message: 'Đã dừng chiến dịch' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
