import { NextResponse } from 'next/server';
import { gpmClient } from '@/lib/gpm/client';
import { db, ProfileRecord } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    // 1. Fetch live profiles from GPM API
    const liveGpm = await gpmClient.getProfiles();
    
    if (liveGpm.success && liveGpm.profiles.length > 0) {
      // Sync into SQLite
      const insertStmt = db.prepare(`
        INSERT INTO profiles (id, gpm_id, name, raw_data, status)
        VALUES (?, ?, ?, ?, 'ready')
        ON CONFLICT(gpm_id) DO UPDATE SET
          name = excluded.name,
          raw_data = excluded.raw_data
      `);

      for (const p of liveGpm.profiles) {
        insertStmt.run(
          crypto.randomUUID(),
          p.id,
          p.name,
          JSON.stringify(p.raw || {})
        );
      }
    }

    // 2. Fetch stored profiles from DB
    const storedProfiles = db.prepare(`SELECT * FROM profiles ORDER BY created_at DESC`).all() as ProfileRecord[];

    return NextResponse.json({
      success: true,
      gpmConnected: liveGpm.success,
      error: liveGpm.error,
      profiles: storedProfiles,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
