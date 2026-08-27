import { db, CampaignRecord, PostRecord, GroupRecord } from '../db';
import { postToFbGroup } from './fb-poster';
import crypto from 'crypto';

// Global active campaign tracking
const activeCampaigns = new Set<string>();

export function isCampaignRunning(campaignId: string): boolean {
  return activeCampaigns.has(campaignId);
}

export function stopCampaign(campaignId: string) {
  activeCampaigns.delete(campaignId);
  db.prepare(`UPDATE campaigns SET status = 'paused' WHERE id = ?`).run(campaignId);
}

export async function runCampaign(campaignId: string) {
  if (activeCampaigns.has(campaignId)) {
    console.log(`Campaign ${campaignId} is already running.`);
    return;
  }

  const campaign = db
    .prepare(`SELECT * FROM campaigns WHERE id = ?`)
    .get(campaignId) as CampaignRecord | undefined;

  if (!campaign) {
    throw new Error(`Chiến dịch không tồn tại (ID: ${campaignId})`);
  }

  const post = db
    .prepare(`SELECT * FROM posts WHERE id = ?`)
    .get(campaign.post_id) as PostRecord | undefined;

  if (!post) {
    throw new Error(`Bài viết không tồn tại (ID: ${campaign.post_id})`);
  }

  const profileIds: string[] = JSON.parse(campaign.profile_ids || '[]');
  const groupIds: string[] = JSON.parse(campaign.group_ids || '[]');

  if (profileIds.length === 0) {
    throw new Error('Chưa chọn Profile GPM nào cho chiến dịch');
  }

  if (groupIds.length === 0) {
    throw new Error('Chưa chọn Group Facebook nào cho chiến dịch');
  }

  // Mark campaign as running
  activeCampaigns.add(campaignId);
  db.prepare(`UPDATE campaigns SET status = 'running' WHERE id = ?`).run(campaignId);

  // Fetch group records
  const placeholders = groupIds.map(() => '?').join(',');
  const groups = db
    .prepare(`SELECT * FROM groups WHERE id IN (${placeholders})`)
    .all(...groupIds) as GroupRecord[];

  const mediaPaths: string[] = post.media_urls ? JSON.parse(post.media_urls) : [];

  // Round-robin or linear posting execution
  (async () => {
    try {
      let groupIdx = 0;

      for (const group of groups) {
        if (!activeCampaigns.has(campaignId)) {
          console.log(`[Runner] Campaign ${campaignId} stopped by user.`);
          break;
        }

        // Pick profile in round-robin fashion
        const currentProfileId = profileIds[groupIdx % profileIds.length];
        groupIdx++;

        const logId = crypto.randomUUID();

        // 1. Record running log
        db.prepare(
          `INSERT INTO logs (id, campaign_id, profile_id, group_id, group_url, status)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(logId, campaignId, currentProfileId, group.id, group.group_url, 'running');

        // Determine post content based on chapter_id
        let postContentToUse = post.content;
        if (campaign.chapter_id) {
          try {
            const chapters = post.chapters ? JSON.parse(post.chapters) : [];
            const selectedChapter = chapters.find((c: any) => c.id === campaign.chapter_id);
            if (selectedChapter && selectedChapter.content) {
              postContentToUse = selectedChapter.content;
            }
          } catch (e) {
            console.error('Lỗi parse chapters:', e);
          }
        }

        // 2. Execute posting
        const result = await postToFbGroup({
          gpmProfileId: currentProfileId,
          groupUrl: group.group_url,
          postContent: postContentToUse,
          mediaPaths,
        });

        // 3. Update log
        if (result.success) {
          db.prepare(
            `UPDATE logs SET status = 'success', post_url = ?, error_message = NULL WHERE id = ?`
          ).run(result.postUrl || group.group_url, logId);
        } else {
          db.prepare(
            `UPDATE logs SET status = 'error', error_message = ? WHERE id = ?`
          ).run(result.errorMessage || 'Lỗi không xác định', logId);
        }

        // 4. Random delay before next post
        if (activeCampaigns.has(campaignId) && groupIdx < groups.length) {
          const delaySec =
            Math.floor(
              Math.random() * (campaign.max_delay - campaign.min_delay + 1)
            ) + campaign.min_delay;
          console.log(`[Runner] Waiting ${delaySec} seconds before next post...`);
          await new Promise((r) => setTimeout(r, delaySec * 1000));
        }
      }

      // Mark completed if still active
      if (activeCampaigns.has(campaignId)) {
        db.prepare(`UPDATE campaigns SET status = 'completed' WHERE id = ?`).run(campaignId);
      }
    } catch (err: any) {
      console.error(`[Runner Error] Campaign ${campaignId}: ${err.message}`);
      db.prepare(`UPDATE campaigns SET status = 'paused' WHERE id = ?`).run(campaignId);
    } finally {
      activeCampaigns.delete(campaignId);
    }
  })();
}
