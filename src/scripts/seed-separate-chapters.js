const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new Database(dbPath);

const posts = db.prepare('SELECT id, title, content FROM posts').all();

function generateChaptersArray(title) {
  const t = title.toLowerCase();

  if (t.includes('naval') || t.includes('almanack')) {
    return [
      {
        id: 'chap-1',
        title: 'Chương 1: Tích lũy tài sản không dựa vào may mắn',
        content: `{Bài học đắt giá từ Chương 1 sách|Nội dung Chương 1 cốt lõi} "${title}":\n• {Sử dụng trí tuệ và sự độc bản để tạo giá trị|Tập trung vào kiến thức chuyên sâu khó thay thế}.\n• {Tự do tài chính là mục tiêu cuối cùng để làm chủ thời gian|Học cách tự động hóa và đòn bẩy công nghệ}.\n\n{Mời mọi người cùng đọc và thảo luận nhé!|Link tải ebook trọn bộ ở bên trên nhé!}`,
      },
      {
        id: 'chap-2',
        title: 'Chương 2: Xây dựng đòn bẩy cá nhân & Tự động hóa',
        content: `{Nội dung nổi bật của Chương 2|Phần đòn bẩy trong} "${title}":\n• {Đòn bẩy bao gồm mã code, truyền thông và vốn đầu tư|Hãy tạo ra sản phẩm có thể nhân bản với chi phí cận biên bằng 0}.\n• {Làm việc có chủ đích và tạo giá trị lâu dài|Đừng đổi thời gian lấy tiền bạc}.\n\n{Bấm link bên trên để tải ngay ebook này về đọc nhé!}`,
      },
      {
        id: 'chap-3',
        title: 'Chương 3: Hạnh phúc là một kỹ năng lựa chọn',
        content: `{Góc nhìn sâu sắc của Chương 3|Trích dẫn hay nhất Chương 3} "${title}":\n• {Hạnh phúc không phải là thứ nhận được mà là thói quen rèn luyện mỗi ngày|Bình thản trong tâm trí là đỉnh cao của thành công}.\n• {Sức khỏe, trí tuệ và tình yêu thương là 3 ưu tiên lớn nhất trong cuộc đời}.\n\n{Chúc cả nhà đọc sách vui vẻ!}`,
      },
    ];
  }

  if (t.includes('productivity') || t.includes('feel-good') || t.includes('hyperfocus') || t.includes('second brain')) {
    return [
      {
        id: 'chap-1',
        title: 'Chương 1: Thiết lập không gian tập trung sâu & Năng lượng',
        content: `{Trích đoạn Chương 1|Nội dung chính Chương 1} "${title}":\n• {Tối ưu hóa năng lượng làm việc thay vì quản lý thời gian đơn thuần|Loại bỏ phân tán tư duy trong thời đại số}.\n• {Biến công việc thành trò chơi hứng thú để kích hoạt năng suất}.\n\n{Mọi người bấm vào link bên trên để tải ebook đọc thêm nhé!}`,
      },
      {
        id: 'chap-2',
        title: 'Chương 2: Xây dựng hệ thống bộ não thứ hai (Second Brain)',
        content: `{Tóm tắt Chương 2|Bí quyết trong Chương 2} "${title}":\n• {Ghi chú và lưu trữ thông tin hiệu quả với phương pháp PARA|Xây dựng kho lưu trữ tri thức cá nhân}.\n• {Giải phóng dung lượng bộ não để tập trung sáng tạo}.\n\n{Link file ebook chất lượng cao đã đính kèm bên trên!}`,
      },
      {
        id: 'chap-3',
        title: 'Chương 3: Biến trì hoãn thành hành động vui vẻ',
        content: `{Bài học thực chiến Chương 3|Ứng dụng Chương 3} "${title}":\n• {Làm việc có chủ đích và tạo trạng thái dòng chảy Flow State|Loại bỏ sự trì hoãn bằng niềm vui}.\n• {Rút ngắn khoảng cách giữa ý tưởng và hành động}.\n\n{Chúc anh em áp dụng thành công vào công việc!}`,
      },
    ];
  }

  // Default 3 distinct chapters for all other books
  return [
    {
      id: 'chap-1',
      title: 'Chương 1: Khai phá tư duy & Nguyên lý nền tảng',
      content: `{Trích đoạn Chương 1 sách|Nội dung mở đầu Chương 1} "${title}":\n• {Cung cấp cái nhìn toàn diện và mới mẻ về chủ đề|Giải quyết triệt để vấn đề cốt lõi bằng tư duy nguyên lý đầu tiên}.\n• {Xây dựng nhận thức đúng đắn trước khi bắt tay thực hành}.\n\n{Tải ngay ebook bản đẹp ở đường link bên trên nhé!}`,
    },
    {
      id: 'chap-2',
      title: 'Chương 2: Phương pháp thực hành & Kỹ năng cốt lõi',
      content: `{Kiến thức trọng tâm Chương 2|Thực hành Chương 2} "${title}":\n• {Các bước hướng dẫn chi tiết, dễ dàng áp dụng ngay|Đúc kết bài học thực tiễn từ kinh nghiệm chuyên gia}.\n• {Tối ưu quy trình để đạt hiệu suất cao nhất}.\n\n{Link đọc sách online miễn phí đã có ở trên!}`,
    },
    {
      id: 'chap-3',
      title: 'Chương 3: Đột phá kết quả & Đúc kết kinh nghiệm',
      content: `{Tổng kết Chương 3|Tóm tắt chương cuối} "${title}":\n• {Thay đổi nhận thức và hành động để đạt kết quả bền vững|Truyền cảm hứng và động lực hành động mạnh mẽ}.\n• {Duy trì thói quen tích cực lâu dài}.\n\n{Chúc các bạn có những giờ phút đọc sách bổ ích!}`,
    },
  ];
}

const updateStmt = db.prepare(`
  UPDATE posts
  SET chapters = ?,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

let count = 0;
for (const p of posts) {
  const chapters = generateChaptersArray(p.title);
  updateStmt.run(JSON.stringify(chapters), p.id);
  count++;
}

console.log(`Successfully updated ${count} books with separated chapter objects.`);
