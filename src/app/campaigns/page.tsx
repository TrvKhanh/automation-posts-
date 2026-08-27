'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PlayCircle, PauseCircle, Plus, Clock, Users, FolderGit2, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [minDelay, setMinDelay] = useState(60);
  const [maxDelay, setMaxDelay] = useState(180);

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, profRes, gRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/posts'),
        fetch('/api/gpm/profiles'),
        fetch('/api/groups'),
      ]);

      const cData = await cRes.json();
      const pData = await pRes.json();
      const profData = await profRes.json();
      const gData = await gRes.json();

      setCampaigns(cData.campaigns || []);
      setPosts(pData.posts || []);
      setProfiles(profData.profiles || []);
      setGroups(gData.groups || []);

      if (pData.posts && pData.posts.length > 0) {
        setSelectedPostId(pData.posts[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedPostId) return alert('Vui lòng điền tên chiến dịch và chọn kịch bản bài viết');

    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          post_id: selectedPostId,
          chapter_id: selectedChapterId,
          profile_ids: profiles.map((p) => p.id),
          group_ids: groups.map((g) => g.id),
          min_delay: minDelay,
          max_delay: maxDelay,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName('');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCampaignStatus = async (id: string, currentStatus: string) => {
    const isRunning = currentStatus === 'running';
    const action = isRunning ? 'stop' : 'start';

    try {
      const res = await fetch(`/api/campaigns/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAF9] font-sans">
      <Header title="Điều khiển Chiến dịch Seeding Auto" />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Chiến dịch Seeding Facebook ({campaigns.length})</h3>
              <p className="text-xs text-slate-500">GPM Script tự động kết nối Playwright CDP đăng bài theo delay ngẫu nhiên</p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo Chiến Dịch Mới
          </button>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
              Đang tải thông tin chiến dịch...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
              Chưa có chiến dịch nào được khởi tạo.
            </div>
          ) : (
            campaigns.map((c) => {
              const isRunning = c.status === 'running';

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">ID: {c.id}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isRunning ? 'Đang chạy' : 'Đang dừng'}
                    </span>
                  </div>

                  {/* Campaign Config Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/60 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Nội Dung Đăng</span>
                      <span className="font-bold text-amber-700 block truncate" title="Sách / Chương">
                        {(() => {
                          const p = posts.find(p => p.id === c.post_id);
                          if (!p) return 'Đã xóa';
                          if (!c.chapter_id) return p.title;
                          let chapters: any[] = [];
                          try {
                            if (p.chapters) chapters = typeof p.chapters === 'string' ? JSON.parse(p.chapters) : p.chapters;
                          } catch(e) {}
                          const chap = chapters.find((ch: any) => ch.id === c.chapter_id);
                          return chap ? `${chap.title}` : p.title;
                        })()}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">GPM Profiles</span>
                      <span className="font-bold text-slate-800">{JSON.parse(c.profile_ids || '[]').length} Ready</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">FB Groups</span>
                      <span className="font-bold text-slate-800">{JSON.parse(c.group_ids || '[]').length} Groups</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Delay Random</span>
                      <span className="font-bold text-slate-800">
                        {c.min_delay || 60}s - {c.max_delay || 180}s
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Khởi tạo: {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </span>

                    <button
                      onClick={() => handleToggleCampaignStatus(c.id, c.status)}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
                        isRunning
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <PauseCircle className="w-4 h-4" /> Dừng Chiến Dịch
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" /> Kích Hoạt Đăng
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Add Campaign */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-600" /> Tạo Chiến Dịch Tự Động Mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Chiến Dịch</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chiến dịch Seeding Sách Kỹ Năng Tuần 4..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn Kịch Bản Bài Viết Spintax</label>
                <select
                  value={selectedPostId}
                  onChange={(e) => {
                    setSelectedPostId(e.target.value);
                    setSelectedChapterId('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                >
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPostId && (() => {
                const sp = posts.find(p => p.id === selectedPostId);
                let chapters: any[] = [];
                try {
                  if (sp?.chapters) {
                    const parsed = typeof sp.chapters === 'string' ? JSON.parse(sp.chapters) : sp.chapters;
                    if (Array.isArray(parsed)) chapters = parsed;
                  }
                } catch(e) {}
                
                if (chapters.length > 0) {
                  return (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chọn Nội Dung Bài Đăng (Chương)</label>
                      <select
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                      >
                        <option value="">-- Mặc định (Nội dung chính / Chương 1) --</option>
                        {chapters.map((c: any, idx: number) => (
                          <option key={c.id || idx} value={c.id}>
                            {c.title || `Chương ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delay Tối Thiểu (Giây)</label>
                  <input
                    type="number"
                    value={minDelay}
                    onChange={(e) => setMinDelay(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delay Tối Đa (Giây)</label>
                  <input
                    type="number"
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Khởi Tạo Chiến Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
