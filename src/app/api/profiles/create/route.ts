import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gpmClient } from '@/lib/gpm/client';
import { loginFacebookAuto } from '@/lib/automation/fb-login';

export async function POST(req: Request) {
  try {
    const { name, loginMethod, credentials } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Thiếu tên Profile' }, { status: 400 });
    }

    // 1. Gửi lệnh tạo Profile sang GPM
    const result = await gpmClient.createProfile(name);
    
    if (!result.success || !result.profileId) {
      return NextResponse.json({ success: false, error: result.error || 'GPM không trả về Profile ID' }, { status: 500 });
    }

    const gpmProfileId = result.profileId;

    // 2. Lưu vào Database
    // Lưu các thông tin nhạy cảm vào raw_data (tuỳ chọn) hoặc notes
    const rawData = JSON.stringify({ loginMethod, credentials });
    
    db.prepare(`
      INSERT INTO profiles (id, gpm_id, name, raw_data, status) 
      VALUES (?, ?, ?, ?, 'ready')
    `).run(`prof_${Date.now()}`, gpmProfileId, name, rawData);

    // 3. Chạy quá trình đăng nhập Facebook ngầm dưới nền
    // Chạy bất đồng bộ (không await) để phản hồi ngay cho giao diện Web, 
    // tránh tình trạng bị timeout nếu quá trình login quá lâu (Playwright thường mất 10s-30s).
    loginFacebookAuto({
      gpmProfileId,
      loginMethod,
      credentials
    }).then(loginRes => {
      if (!loginRes.success) {
        // Cập nhật trạng thái lỗi nếu đăng nhập thất bại
        try {
          db.prepare(`UPDATE profiles SET status = 'error', notes = ? WHERE gpm_id = ?`)
            .run(loginRes.errorMessage || 'Lỗi đăng nhập FB', gpmProfileId);
        } catch (e) {}
      }
    });

    return NextResponse.json({ 
      success: true, 
      gpmProfileId,
      message: 'Profile đã được tạo thành công và đang được đăng nhập.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
