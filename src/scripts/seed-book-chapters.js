const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new Database(dbPath);

const posts = db.prepare('SELECT id, title, content, book_link, media_urls FROM posts').all();

console.log(`Found ${posts.length} posts to update with rich chapter contents & spintax.`);

// Predefined detailed chapter spintax templates based on book categories & titles
function generateChapterContent(title) {
  const t = title.toLowerCase();

  if (t.includes('naval') || t.includes('almanack')) {
    return `{Chương 1: Tích lũy tài sản không dựa vào may mắn|Chương 2: Xây dựng đòn bẩy cá nhân|Chương 3: Hạnh phúc là một kỹ năng lựa chọn}\n\n` +
      `{Bài học đắt giá từ cuốn sách|Tóm tắt cốt lõi nội dung sách} "${title}":\n` +
      `• {Sử dụng trí tuệ và sự độc bản để tạo giá trị|Tập trung vào kiến thức chuyên sâu khó thay thế}\n` +
      `• {Tự do tài chính là mục tiêu cuối cùng để làm chủ thời gian|Học cách tự động hóa và đòn bẩy công nghệ}\n` +
      `• {Hạnh phúc không phải là thứ nhận được mà là thói quen rèn luyện mỗi ngày|Bình thản trong tâm trí là đỉnh cao của thành công}.\n\n` +
      `{Link tải ebook / đọc online ở góc màn hình|Mời mọi người cùng đọc và thảo luận nhé!}`;
  }

  if (t.includes('productivity') || t.includes('feel-good') || t.includes('hyperfocus') || t.includes('second brain')) {
    return `{Chương 1: Thiết lập không gian tập trung sâu|Chương 2: Xây dựng hệ thống bộ não thứ hai|Chương 3: Biến công việc thành trò chơi hứng thú}\n\n` +
      `{Điểm nổi bật của các chương trong sách|Nội dung cốt lõi của cuốn sách} "${title}":\n` +
      `• {Tối ưu hóa năng lượng làm việc thay vì quản lý thời gian đơn thuần|Loại bỏ phân tán tư duy trong thời đại số}\n` +
      `• {Ghi chú và lưu trữ thông tin hiệu quả với phương pháp PARA|Xây dựng kho lưu trữ tri thức cá nhân}\n` +
      `• {Làm việc có chủ đích và tạo trạng thái dòng chảy Flow State|Loại bỏ sự trì hoãn bằng niềm vui}.\n\n` +
      `{Chia sẻ ebook đầy đủ cho anh em đọc thêm|Mọi người bấm vào link bên dưới để lấy bản đẹp nhé!}`;
  }

  if (t.includes('hurt me') || t.includes('mind') || t.includes('manifest') || t.includes('ageless')) {
    return `{Chương 1: Quy tắc 40% và giới hạn suy nghĩ|Chương 2: Gương soi trách nhiệm bản thân|Chương 3: Rèn luyện tâm trí trong nghịch cảnh}\n\n` +
      `{Những chương học giá trị nhất từ cuốn sách|Nội dung trích dẫn truyền cảm hứng trong} "${title}":\n` +
      `• {Khi bạn nghĩ mình đã kiệt sức, bạn mới chỉ dùng 40% sức mạnh|Bứt phá giới hạn an toàn của bản thân}\n` +
      `• {Đối mặt trực diện với điểm yếu để biến thành lợi thế|Lấy thất bại làm nhiên liệu tiến lên}\n` +
      `• {Kỷ luật bản thân chính là chìa khóa của tự do thực sự|Làm chủ tư duy và cuộc sống}.\n\n` +
      `{File ebook chất lượng cao đã sẵn sàng|Chúc cả nhà đọc sách vui vẻ!}`;
  }

  if (t.includes('buffett') || t.includes('money') || t.includes('rich') || t.includes('invest') || t.includes('trading')) {
    return `{Chương 1: Nguyên lý đầu tư giá trị cốt lõi|Chương 2: Quản trị rủi ro và biên độ an toàn|Chương 3: Tư duy dài hạn và sức mạnh lãi kép}\n\n` +
      `{Tóm tắt kiến thức tài chính & đầu tư từ sách|Đúc kết bài học đắt giá trong} "${title}":\n` +
      `• {Đầu tư vào bản thân là khoản đầu tư sinh lời nhất|Hiểu rõ lợi thế cạnh tranh của doanh nghiệp}\n` +
      `• {Kiểm soát cảm xúc trước sự biến động của thị trường|Giữ nguyên tắc biên độ an toàn Margin of Safety}\n` +
      `• {Hãy tham lam khi người khác sợ hãi và kiên nhẫn tích lũy|Tận dụng sức mạnh lãi kép qua thời gian}.\n\n` +
      `{Anh em quan tâm tài chính tải ngay ebook này về nghiên cứu nhé!}`;
  }

  // Default Chapter & Spintax template
  return `{Chương 1: Tổng quan & Khai phá tư duy|Chương 2: Phương pháp thực hành cốt lõi|Chương 3: Ứng dụng thực tế & Đột phá}\n\n` +
    `{Trích đoạn nội dung sâu sắc từ cuốn sách|Tóm tắt nội dung chính của các chương sách} "${title}":\n` +
    `• {Cung cấp cái nhìn toàn diện và mới mẻ về chủ đề|Giải quyết triệt để vấn đề cốt lõi bằng tư duy nguyên lý đầu tiên}\n` +
    `• {Các bước hướng dẫn chi tiết, dễ dàng áp dụng ngay|Đúc kết bài học thực tiễn từ kinh nghiệm chuyên gia}\n` +
    `• {Thay đổi nhận thức và hành động để đạt kết quả bền vững|Truyền cảm hứng và động lực hành động}.\n\n` +
    `{Link chia sẻ ebook miễn phí ở bên dưới|Mọi người bấm vào link để đọc trọn vẹn nhé!}`;
}

const updateStmt = db.prepare(`
  UPDATE posts
  SET content = ?,
      chapters = ?,
      book_link = COALESCE(NULLIF(book_link, ''), ?),
      media_urls = COALESCE(NULLIF(media_urls, ''), ?),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

let count = 0;
for (const p of posts) {
  const chapterSpintax = generateChapterContent(p.title);
  const chaptersJson = JSON.stringify([
    `Chương 1: Tổng quan & Bài học mở đầu`,
    `Chương 2: Phân tích chuyên sâu & Thực hành`,
    `Chương 3: Đúc kết & Ứng dụng thực tế`,
  ]);
  const defaultBookLink = `https://drive.google.com/search?q=${encodeURIComponent(p.title)}`;
  const defaultMedia = JSON.stringify(['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800']);

  updateStmt.run(chapterSpintax, chaptersJson, defaultBookLink, defaultMedia, p.id);
  count++;
}

console.log(`Successfully updated ${count} posts with rich chapter contents, spintax, book links, and images!`);
