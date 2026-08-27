import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for performance & concurrency
db.pragma('journal_mode = WAL');

// Initialize Database Tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      gpm_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      raw_data TEXT,
      status TEXT DEFAULT 'ready',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      group_url TEXT NOT NULL,
      group_id_fb TEXT,
      category TEXT DEFAULT 'General',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      media_urls TEXT,
      book_link TEXT,
      chapters TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      post_id TEXT NOT NULL,
      profile_ids TEXT NOT NULL,
      group_ids TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      min_delay INTEGER DEFAULT 60,
      max_delay INTEGER DEFAULT 180,
      max_posts_per_profile INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      group_url TEXT NOT NULL,
      status TEXT NOT NULL,
      post_url TEXT,
      error_message TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure new columns exist for existing databases
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN book_link TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN chapters TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE campaigns ADD COLUMN chapter_id TEXT;`);
  } catch (e) {}
}

// Auto-run schema initialization
initDb();

export interface ProfileRecord {
  id: string;
  gpm_id: string;
  name: string;
  raw_data?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface GroupRecord {
  id: string;
  name: string;
  group_url: string;
  group_id_fb?: string;
  category: string;
  status: string;
  created_at: string;
}

export interface PostRecord {
  id: string;
  title: string; // Tên cuốn sách
  content: string; // Nội dung bài viết / Spintax
  media_urls?: string; // JSON string array hoặc URL hình ảnh sách
  book_link?: string; // Link tải / mua / tham khảo sách
  chapters?: string; // Nội dung các chương (JSON string hoặc text)
  created_at: string;
  updated_at: string;
}

export interface CampaignRecord {
  id: string;
  name: string;
  post_id: string;
  chapter_id?: string;
  profile_ids: string; // JSON string array
  group_ids: string; // JSON string array
  status: 'idle' | 'running' | 'paused' | 'completed';
  min_delay: number;
  max_delay: number;
  max_posts_per_profile: number;
  created_at: string;
}

export interface LogRecord {
  id: string;
  campaign_id: string;
  profile_id: string;
  group_id: string;
  group_url: string;
  status: 'success' | 'error' | 'running';
  post_url?: string;
  error_message?: string;
  executed_at: string;
}
