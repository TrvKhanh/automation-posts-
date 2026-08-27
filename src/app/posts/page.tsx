'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  Plus,
  Sparkles,
  Trash2,
  Eye,
  CheckCircle2,
  Search,
  BookOpen,
  ExternalLink,
  ImageIcon,
  Link2,
  Bookmark,
  Layers,
  Code2,
  Copy,
  Check,
  BookMarked,
  Maximize2,
  RefreshCw,
  Edit3,
  X,
} from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Edit Book Modal state
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // Search & Filter
  const [q, setQ] = useState('');
  const [selectedBookTitle, setSelectedBookTitle] = useState('');

  // Form states for Book
  const [bookTitle, setBookTitle] = useState('');
  const [bookLink, setBookLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Dynamic chapters form list
  const [formChapters, setFormChapters] = useState<Chapter[]>([
    { id: 'chap-1', title: 'Chương 1: Mở Đầu & Tư Duy Cốt Lõi', content: '' },
    { id: 'chap-2', title: 'Chương 2: Thực Hành & Kỹ Năng', content: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Cover Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  // Reader Modal State (Click into chapter to read)
  const [activeReader, setActiveReader] = useState<{
    bookTitle: string;
    chapterTitle: string;
    rawContent: string;
    resolvedContent: string;
    viewTab: 'reader' | 'raw';
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [q]);

  const parseSpintax = (text: string) => {
    if (!text) return '';
    const matches = text.match(/{[^{}]*}/g);
    if (!matches) return text;
    let result = text;
    matches.forEach((match) => {
      const choices = match.slice(1, -1).split('|');
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      result = result.replace(match, randomChoice);
    });
    return result;
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenReader = (bookTitle: string, chapterTitle: string, rawContent: string) => {
    setActiveReader({
      bookTitle,
      chapterTitle,
      rawContent,
      resolvedContent: parseSpintax(rawContent),
      viewTab: 'reader',
    });
  };

  const handleRerollReader = () => {
    if (!activeReader) return;
    setActiveReader({
      ...activeReader,
      resolvedContent: parseSpintax(activeReader.rawContent),
    });
  };

  const handleAddFormChapter = () => {
    const nextNum = formChapters.length + 1;
    setFormChapters([
      ...formChapters,
      { id: `chap-${Date.now()}`, title: `Chương ${nextNum}: Tiêu đề chương`, content: '' },
    ]);
  };

  const handleRemoveFormChapter = (index: number) => {
    if (formChapters.length <= 1) return alert('Một cuốn sách phải có ít nhất 1 chương');
    setFormChapters(formChapters.filter((_, i) => i !== index));
  };

  const handleUpdateFormChapter = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...formChapters];
    updated[index][field] = value;
    setFormChapters(updated);
  };

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post);
    setBookTitle(post.title);
    setBookLink(post.book_link || '');

    let images: string[] = [];
    try {
      if (post.media_urls) {
        images = typeof post.media_urls === 'string' ? JSON.parse(post.media_urls) : post.media_urls;
      }
    } catch (e) {}
    setImageUrl(images[0] || (typeof post.media_urls === 'string' ? post.media_urls : ''));

    let chaptersList: Chapter[] = [];
    try {
      if (post.chapters) {
        const parsed = typeof post.chapters === 'string' ? JSON.parse(post.chapters) : post.chapters;
        if (Array.isArray(parsed)) {
          chaptersList = parsed.map((item, idx) => {
            if (typeof item === 'string') {
              return { id: `chap-${idx}`, title: item, content: post.content };
            }
            return item;
          });
        }
      }
    } catch (e) {}

    if (chaptersList.length === 0) {
      chaptersList = [{ id: 'chap-1', title: 'Chương 1: Mở Đầu & Tư Duy', content: post.content }];
    }

    setFormChapters(chaptersList);
    setShowModal(true);
  };

  const handleCreateOrUpdateBookPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle) {
      return alert('Vui lòng nhập Tên cuốn sách');
    }

    if (formChapters.some((c) => !c.title || !c.content)) {
      return alert('Vui lòng nhập đầy đủ Tiêu đề và Nội dung cho tất cả các chương');
    }

    setSubmitting(true);
    try {
      const isEdit = !!editingPost;
      const url = '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        title: bookTitle,
        content: formChapters[0]?.content || '',
        book_link: bookLink,
        media_urls: imageUrl ? [imageUrl] : [],
        chapters: formChapters,
      };

      if (isEdit) {
        payload.id = editingPost.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingPost(null);
        setBookTitle('');
        setBookLink('');
        setImageUrl('');
        setFormChapters([
          { id: 'chap-1', title: 'Chương 1: Mở Đầu & Tư Duy Cốt Lõi', content: '' },
          { id: 'chap-2', title: 'Chương 2: Thực Hành & Kỹ Năng', content: '' },
        ]);
        fetchPosts();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa cuốn sách và toàn bộ các chương này?')) return;
    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  // Distinct list of book titles for dropdown filter
  const distinctBookTitles = Array.from(new Set(posts.map((p) => p.title))).filter(Boolean);

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    if (selectedBookTitle && p.title !== selectedBookTitle) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Quản lý Đầu Sách & Các Chương Bài Đăng (Spintax)" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Danh mục Đầu Sách ({posts.length} Sách)</h3>
                <p className="text-xs text-slate-500">
                  Bấm vào Bìa Sách để xem ảnh, bấm vào Link Sách để mở/chép link, hoặc bấm từng Chương để đọc chi tiết
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingPost(null);
                setBookTitle('');
                setBookLink('');
                setImageUrl('');
                setFormChapters([
                  { id: 'chap-1', title: 'Chương 1: Mở Đầu & Tư Duy Cốt Lõi', content: '' },
                  { id: 'chap-2', title: 'Chương 2: Thực Hành & Kỹ Năng', content: '' },
                ]);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Thêm Đầu Sách & Các Chương
            </button>
          </div>

          {/* Filters Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm Tên cuốn sách hoặc nội dung chương..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>

            {/* Book Title Dropdown Filter */}
            <select
              value={selectedBookTitle}
              onChange={(e) => setSelectedBookTitle(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none w-full sm:w-64 shrink-0"
            >
              <option value="">-- Tất cả Đầu Sách ({distinctBookTitles.length}) --</option>
              {distinctBookTitles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Book Cards Grid */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
              Đang tải danh sách đầu sách và các chương...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
              Không tìm thấy cuốn sách nào phù hợp. Vui lòng thử từ khóa khác!
            </div>
          ) : (
            filteredPosts.map((post) => {
              // Parse chapters array
              let chaptersList: Chapter[] = [];
              try {
                if (post.chapters) {
                  const parsed = typeof post.chapters === 'string' ? JSON.parse(post.chapters) : post.chapters;
                  if (Array.isArray(parsed)) {
                    chaptersList = parsed.map((item, idx) => {
                      if (typeof item === 'string') {
                        return { id: `chap-${idx}`, title: item, content: post.content };
                      }
                      return item;
                    });
                  }
                }
              } catch (e) {}

              if (chaptersList.length === 0) {
                chaptersList = [
                  {
                    id: `chap-0`,
                    title: `Chương 1: Nội Dung Cốt Lõi Sách`,
                    content: post.content || `Chia sẻ ebook: ${post.title}`,
                  },
                ];
              }

              // Parse media_urls array
              let images: string[] = [];
              try {
                if (post.media_urls) {
                  images = typeof post.media_urls === 'string' ? JSON.parse(post.media_urls) : post.media_urls;
                }
              } catch (e) {}
              const coverImg = images[0] || (typeof post.media_urls === 'string' ? post.media_urls : '');

              return (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5 hover:border-slate-300 transition"
                >
                  {/* Book Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold border border-amber-200 shrink-0 overflow-hidden relative group">
                        {coverImg ? (
                          <img
                            src={coverImg}
                            alt={post.title}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewImage({ title: post.title, url: coverImg })}
                          />
                        ) : (
                          <Bookmark className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-slate-900 leading-tight">{post.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 shrink-0">
                            {chaptersList.length} Chương
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {post.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Active Book Link Button */}
                      {post.book_link ? (
                        <a
                          href={post.book_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition border border-amber-200"
                          title={`Mở link: ${post.book_link}`}
                        >
                          <Link2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Link Cuốn Sách</span>
                          <ExternalLink className="w-3 h-3 text-amber-700" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium text-xs border border-slate-200 transition"
                        >
                          <Link2 className="w-3.5 h-3.5 text-slate-400" /> + Thêm Link Sách
                        </button>
                      )}

                      {/* Active Image Preview Button */}
                      {coverImg ? (
                        <button
                          onClick={() => setPreviewImage({ title: post.title, url: coverImg })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                          <span>Xem Ảnh Bìa</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> + Thêm Ảnh Bìa
                        </button>
                      )}

                      {/* Edit Book Metadata Button */}
                      <button
                        onClick={() => handleOpenEditModal(post)}
                        className="p-1.5 text-slate-500 hover:text-amber-800 transition rounded-lg hover:bg-amber-50 border border-slate-200/80"
                        title="Chỉnh sửa thông tin sách & các chương"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Book Button */}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 border border-slate-200/80"
                        title="Xóa đầu sách"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Separated Individual Chapter Cards */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" /> Nhấp vào Chương để Đọc Chi Tiết ({chaptersList.length}):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {chaptersList.map((chap, idx) => (
                        <div
                          key={chap.id || idx}
                          onClick={() => handleOpenReader(post.title, chap.title, chap.content)}
                          className="group cursor-pointer bg-slate-50/90 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400 rounded-xl p-4 flex flex-col justify-between space-y-3 transition duration-200 shadow-2xs hover:shadow-md"
                        >
                          {/* Chapter Title & Header */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md border border-amber-200 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                                Chương {idx + 1}
                              </span>

                              <span className="text-amber-700 group-hover:translate-x-0.5 transition flex items-center gap-1 text-[11px] font-bold">
                                <Maximize2 className="w-3 h-3" /> Đọc ngay
                              </span>
                            </div>

                            <h5 className="font-bold text-xs text-slate-900 group-hover:text-amber-900 transition line-clamp-1">
                              {chap.title}
                            </h5>

                            {/* Chapter Content Preview */}
                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 line-clamp-4 whitespace-pre-wrap leading-relaxed shadow-2xs">
                              {chap.content}
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 group-hover:text-amber-800 font-medium flex items-center gap-1">
                              <BookMarked className="w-3.5 h-3.5 text-amber-600" /> Bấm để xem toàn văn
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(`${post.id}-${idx}`, chap.content);
                              }}
                              className="text-slate-500 hover:text-slate-900 p-1 font-semibold text-[11px] flex items-center gap-1"
                              title="Sao chép Spintax"
                            >
                              {copiedId === `${post.id}-${idx}` ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã chép
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Chép
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cover Image Viewer Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" /> Ảnh Bìa Sách: {previewImage.title}
              </h4>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 max-h-96 flex items-center justify-center border border-slate-200">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-96 w-auto object-contain"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800';
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-800 hover:underline flex items-center gap-1 font-semibold"
              >
                Mở link ảnh gốc <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Reader & Spintax Viewer Modal */}
      {activeReader && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Reader Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200">
                    {activeReader.bookTitle}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 pt-1">
                  <BookMarked className="w-5 h-5 text-amber-600" /> {activeReader.chapterTitle}
                </h3>
              </div>
              <button
                onClick={() => setActiveReader(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveReader({ ...activeReader, viewTab: 'reader' })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeReader.viewTab === 'reader'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📖 Bản Đọc Hoàn Chỉnh (Đã Xáo Spintax)
                </button>
                <button
                  onClick={() => setActiveReader({ ...activeReader, viewTab: 'raw' })}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeReader.viewTab === 'raw'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" /> Mã Gốc Spintax
                </button>
              </div>

              {activeReader.viewTab === 'reader' && (
                <button
                  onClick={handleRerollReader}
                  className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200 flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3 text-amber-700" /> Xáo Bản Mới
                </button>
              )}
            </div>

            {/* Reader Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 bg-amber-50/30 border border-amber-200/60 rounded-xl space-y-3">
              {activeReader.viewTab === 'reader' ? (
                <div className="prose prose-slate max-w-none text-slate-800 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                  {activeReader.resolvedContent}
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeReader.rawContent}
                </div>
              )}
            </div>

            {/* Reader Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                {activeReader.viewTab === 'reader'
                  ? '✨ Nội dung ngẫu nhiên sẵn sàng copy để đăng bài Facebook'
                  : '⚙️ Cú pháp Spintax gốc dùng cho hệ thống tự động hóa'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopyText(
                      'reader-copy',
                      activeReader.viewTab === 'reader' ? activeReader.resolvedContent : activeReader.rawContent
                    )
                  }
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {copiedId === 'reader-copy' ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" /> Đã Sao Chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Sao Chép Nội Dung
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm & Chỉnh Sửa Đầu Sách / Link / Bìa / Các Chương */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                {editingPost ? 'Chỉnh Sửa Thông Tin Sách & Link / Bìa / Chương' : 'Thêm Đầu Sách & Tách Riêng Nội Dung Các Chương'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPost(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateBookPost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Cuốn Sách</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Feel-Good Productivity, Hyperfocus, Naval Ravikant..."
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Cuốn Sách / Ebook (Bấm nút mở link)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={bookLink}
                    onChange={(e) => setBookLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Hình Ảnh / Bìa Sách (Bấm xem ảnh)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Dynamic Chapters Form */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" /> Danh sách Các Chương Bài Viết ({formChapters.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFormChapter}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[11px] rounded-md border border-amber-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Chương Mới
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {formChapters.map((chap, idx) => (
                    <div key={chap.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          value={chap.title}
                          onChange={(e) => handleUpdateFormChapter(idx, 'title', e.target.value)}
                          placeholder={`Tên Chương ${idx + 1}...`}
                          className="font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded-md px-2.5 py-1 flex-1 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFormChapter(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Xóa chương này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        required
                        placeholder={`Nhập Spintax bài viết cho Chương ${idx + 1}... Ví dụ: {Bài học Chương ${idx + 1}|Nội dung Chương ${idx + 1}}...`}
                        value={chap.content}
                        onChange={(e) => handleUpdateFormChapter(idx, 'content', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {editingPost ? 'Cập Nhật Sách' : 'Lưu Cuốn Sách & Các Chương'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
