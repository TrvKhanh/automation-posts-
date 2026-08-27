import { NextResponse } from 'next/server';
import { db, CampaignRecord, PostRecord, GroupRecord, LogRecord } from '@/lib/db';
import { parseSpintax } from '@/lib/utils/spintax';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId') || searchParams.get('gpmId');

    // 1. Find an active campaign
    const runningCampaign = db
      .prepare(`SELECT * FROM campaigns WHERE status = 'running' ORDER BY created_at ASC LIMIT 1`)
      .get() as CampaignRecord | undefined;

    if (!runningCampaign) {
      return NextResponse.json({
        hasTask: false,
        message: 'Không có chiến dịch nào đang mở chạy',
      });
    }

    const post = db
      .prepare(`SELECT * FROM posts WHERE id = ?`)
      .get(runningCampaign.post_id) as PostRecord | undefined;

    if (!post) {
      return NextResponse.json({ hasTask: false, message: 'Bài viết không tồn tại' });
    }

    const groupIds: string[] = JSON.parse(runningCampaign.group_ids || '[]');
    
    // Find groups not yet posted in this campaign
    const postedLogs = db
      .prepare(`SELECT group_id FROM logs WHERE campaign_id = ? AND status = 'success'`)
      .all(runningCampaign.id) as { group_id: string }[];

    const postedGroupIds = new Set(postedLogs.map((l) => l.group_id));
    const targetGroupId = groupIds.find((id) => !postedGroupIds.has(id));

    if (!targetGroupId) {
      // Mark campaign as completed
      db.prepare(`UPDATE campaigns SET status = 'completed' WHERE id = ?`).run(runningCampaign.id);
      return NextResponse.json({ hasTask: false, message: 'Chiến dịch đã đăng xong tất cả các nhóm' });
    }

    const targetGroup = db
      .prepare(`SELECT * FROM groups WHERE id = ?`)
      .get(targetGroupId) as GroupRecord | undefined;

    if (!targetGroup) {
      return NextResponse.json({ hasTask: false, message: 'Không tìm thấy Group mục tiêu' });
    }

    // 2. Generate random Spintax content
    const parsedText = parseSpintax(post.content);
    const taskId = crypto.randomUUID();

    // 3. Create a pending log entry
    db.prepare(`
      INSERT INTO logs (id, campaign_id, profile_id, group_id, group_url, status)
      VALUES (?, ?, ?, ?, ?, 'running')
    `).run(
      taskId,
      runningCampaign.id,
      profileId || 'gpm-automate-runner',
      targetGroup.id,
      targetGroup.group_url
    );

    return NextResponse.json({
      hasTask: true,
      taskId,
      campaignId: runningCampaign.id,
      groupUrl: targetGroup.group_url,
      postTitle: post.title,
      postContent: parsedText,
      mediaUrls: post.media_urls ? JSON.parse(post.media_urls) : [],
      minDelay: runningCampaign.min_delay,
      maxDelay: runningCampaign.max_delay,
    });
  } catch (err: any) {
    return NextResponse.json({ hasTask: false, error: err.message }, { status: 500 });
  }
}
