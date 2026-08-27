const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const csvPath = path.join(process.cwd(), 'Các group ebook - Seeding.csv');
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

if (!fs.existsSync(csvPath) || !fs.existsSync(dbPath)) {
  console.error('CSV file or SQLite DB missing');
  process.exit(1);
}

const db = new Database(dbPath);
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

const groupToLinks = {};

lines.forEach((line) => {
  let inQuotes = false;
  let current = '';
  const row = [];
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  row.push(current.trim().replace(/^"|"$/g, ''));

  const groupName = row[3];
  const link = row[5];

  if (groupName && link && groupName !== 'Tên nhóm') {
    if (!groupToLinks[groupName]) groupToLinks[groupName] = new Set();
    groupToLinks[groupName].add(link);
  }
});

const updateStmt = db.prepare('UPDATE groups SET group_url = ? WHERE name = ?');

let updatedCount = 0;
for (const [name, links] of Object.entries(groupToLinks)) {
  const linkArr = Array.from(links);
  const fbGroupLink = linkArr.find((l) => l.includes('facebook.com/groups/'));
  let targetUrl = '';
  if (fbGroupLink) {
    const match = fbGroupLink.match(/(https?:\/\/(?:www\.)?facebook\.com\/groups\/[^\/]+\/)/);
    if (match) {
      targetUrl = match[1];
    } else {
      targetUrl = fbGroupLink;
    }
  } else {
    targetUrl = linkArr[0];
  }

  if (targetUrl) {
    const res = updateStmt.run(targetUrl, name);
    if (res.changes > 0) {
      updatedCount += res.changes;
    }
  }
}

console.log(`Updated ${updatedCount} group URLs successfully.`);
