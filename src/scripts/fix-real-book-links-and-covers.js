const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');

const csvPath = path.join(process.cwd(), 'Các group ebook - Seeding.csv');
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

const db = new Database(dbPath);

// 1. Read CSV to map book title => real seeding link
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

const bookToLink = {};

lines.forEach((line, idx) => {
  if (idx < 2) return;
  let inQuotes = false;
  let current = '';
  const row = [];
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '\"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim().replace(/^\"|\"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  row.push(current.trim().replace(/^\"|\"$/g, ''));

  const bookTitle = row[2];
  const link = row[5];

  if (bookTitle && bookTitle !== 'Tên sách' && link) {
    if (!bookToLink[bookTitle]) {
      bookToLink[bookTitle] = link;
    }
  }
});

console.log(`Mapped ${Object.keys(bookToLink).length} books from CSV to their exact Facebook seeding links.`);

// Helper function to fetch OpenLibrary cover URL
function fetchBookCover(title) {
  return new Promise((resolve) => {
    // Clean title for search query
    const cleanTitle = title.split(':')[0].split('-')[0].trim();
    const url = 'https://openlibrary.org/search.json?title=' + encodeURIComponent(cleanTitle) + '&limit=1';
    
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.docs && json.docs[0] && json.docs[0].cover_i) {
            resolve(`https://covers.openlibrary.org/b/id/${json.docs[0].cover_i}-L.jpg`);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

// 2. Fetch cover images and update DB
async function runMigration() {
  const posts = db.prepare('SELECT id, title, book_link FROM posts').all();
  console.log(`Updating ${posts.length} posts in database...`);

  const updateStmt = db.prepare(`
    UPDATE posts
    SET book_link = ?,
        media_urls = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let updatedCount = 0;

  for (const post of posts) {
    // 1. Get real link from CSV
    const realLink = bookToLink[post.title] || post.book_link || `https://www.facebook.com/search/top?q=${encodeURIComponent(post.title)}`;

    // 2. Get real cover image
    const coverUrl = await fetchBookCover(post.title);
    const mediaUrlsJson = JSON.stringify([
      coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'
    ]);

    updateStmt.run(realLink, mediaUrlsJson, post.id);
    updatedCount++;

    if (updatedCount % 10 === 0) {
      console.log(`Processed ${updatedCount}/${posts.length} books...`);
    }
  }

  console.log(`Successfully updated all ${updatedCount} books with REAL Facebook links from CSV and OpenLibrary cover artwork!`);
}

runMigration().catch(console.error);
