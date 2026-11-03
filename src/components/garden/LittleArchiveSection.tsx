import React, { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Lock,
  Globe2,
  X,
  ZoomIn,
  Filter,
  Sparkles,
} from 'lucide-react';
import { memoryArchiveService, authService } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

export const LittleArchiveSection: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [dateTaken, setDateTaken] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox preview
  const [lightboxMemory, setLightboxMemory] = useState<MemoryEntry | null>(null);

  const partner = authService.getPartner();

  const loadMemories = async () => {
    try {
      setLoading(true);
      const list = await memoryArchiveService.getMemories();
      setMemories(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadMemories();
    });
    return unsubscribe;
  }, []);

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setCaption('');
    setDescription('');
    setPhotoUrl('');
    setDateTaken('');
    setIsShared(true);
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photoUrl.trim()) {
      setErrorMsg('Please provide a title and a valid photo URL.');
      return;
    }

    try {
      await memoryArchiveService.addMemory({
        title,
        caption,
        description,
        photoUrl,
        dateTaken: dateTaken || 'Special Day',
        isShared,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setIsAdding(false);
      await loadMemories();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save memory.');
    }
  };

  const handleDelete = async (memory: MemoryEntry) => {
    if (memory.contributorId !== currentUser.id) return;
    if (window.confirm(`Delete keepsake "${memory.title}"?`)) {
      await memoryArchiveService.deleteMemory(memory.id);
      setLightboxMemory(null);
      await loadMemories();
    }
  };

  const handleToggleReaction = (mem: MemoryEntry) => {
    soundEngine.playSparkle();
    const reactions = ['Precious! 💖', 'Unforgettable ✨', 'My favorite 🌸', 'Pure joy 🌷'];
    const currentReaction = (mem as any).reaction || '';
    const currentIdx = reactions.findIndex((r) => r.includes(currentReaction.replace(/[^\w\s]/gi, '').trim()));
    const nextReaction = reactions[(currentIdx + 1) % reactions.length];

    const updated = memories.map((m) => (m.id === mem.id ? { ...m, reaction: nextReaction } : m));
    setMemories(updated);
    if (lightboxMemory?.id === mem.id) {
      setLightboxMemory({ ...lightboxMemory, reaction: nextReaction } as any);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'shared') return m.isShared;
    if (activeFilter === 'private') return !m.isShared;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup Format */}
      <section
        className="relative rounded-3xl overflow-hidden border border-pink-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 16, 44, 0.94) 0%, rgba(20, 8, 28, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_archive.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
          }}
        />

        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-pink-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/card_archive.jpg"
                alt="Our Little Archive Polaroid"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-8 h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Our Little Archive</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Our Little Archive</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-pink-200/90 max-w-xl leading-relaxed">
                A growing polaroid album for snapshots, dates, and inside memories.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-pink-300/70 pt-1">
                Capture • Preserve • Remember • Always
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Add New Snapshot</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Memories Grid — 2 Column Responsive Glass Cards matching Mockup */}
      {loading ? (
        <div className="py-16 text-center text-pink-300/60 text-xs font-mono animate-pulse">
          Unfurling our polaroid memories...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-4 border border-pink-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-2xl text-white">No snapshots in this view yet</h4>
          <p className="text-xs sm:text-sm text-pink-200/80 max-w-md mx-auto font-light leading-relaxed">
            {activeFilter === 'all'
              ? 'Add a photo from your camera roll or a shared memory to keep in bloom.'
              : `No memories currently marked as "${activeFilter}".`}
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Snapshot 📷</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredMemories.map((mem) => {
            const isAddedByMe = mem.contributorId === currentUser.id;

            return (
              <div
                key={mem.id}
                className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-pink-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 16, 48, 0.65) 0%, rgba(20, 8, 28, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Left Square Polaroid Artwork with Zoom Button */}
                  <div
                    onClick={() => setLightboxMemory(mem)}
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer"
                    style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px', maxWidth: '112px', maxHeight: '112px' }}
                    title="Click to view full photo"
                  >
                    <img
                      src={mem.photoUrl || '/assets/garden/card_archive.jpg'}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover/cover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        <ZoomIn className="w-4 h-4 text-pink-300" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Privacy Badge, Date & Caption */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors truncate">
                        {mem.title}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                          mem.isShared
                            ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                            : 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                        }`}
                      >
                        {mem.isShared ? <Globe2 className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-purple-300" />}
                        <span>{mem.isShared ? 'Shared' : 'Private'}</span>
                      </span>
                    </div>

                    {/* Date Taken */}
                    <div className="text-[11px] text-pink-300/70 font-mono">
                      {mem.dateTaken || 'Special Day'}
                    </div>

                    {/* Caption / Personal Whisper */}
                    {mem.caption ? (
                      <p className="text-xs text-pink-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                        “{mem.caption}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className="text-xs text-pink-300/60 font-serif italic line-clamp-1 pt-1">
                        Captured in our personal archive...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + View Memories Button */}
                <div className="pt-3 border-t border-pink-400/20 flex items-center justify-between gap-3 text-xs">
                  {/* Contributor Avatar & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-[11px] text-pink-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-pink-200/90 truncate">
                      By: {isAddedByMe ? 'You' : mem.contributorName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & View Memory Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(mem)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 text-[11px] text-pink-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle reaction"
                    >
                      <span>{(mem as any).reaction || 'Precious! 💖'}</span>
                    </button>

                    <button
                      onClick={() => setLightboxMemory(mem)}
                      className="btn-glow-romantic text-[11px] py-1 px-3.5 shadow-sm"
                    >
                      <span>View Memory</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Action & Filter Section — Matching Mockup Format */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-2">
        {/* Left Card: Add Polaroid Banner (~7 Cols) */}
        <div
          className="lg:col-span-7 rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 justify-between border border-pink-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(36, 16, 44, 0.7) 0%, rgba(20, 8, 28, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
            <div
              className="rounded-2xl overflow-hidden border border-pink-400/30 shrink-0 shadow-lg group"
              style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
            >
              <img
                src="/assets/garden/card_archive.jpg"
                alt="Polaroid Memory"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Add a New Polaroid Keepsake
              </h4>
              <p className="text-xs sm:text-sm text-pink-200/80 font-light leading-relaxed">
                Preserve candid moments, trip photos, and inside smiles forever.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Add Snapshot →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters (~5 Cols) */}
        <div
          className="lg:col-span-5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 border border-pink-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 14, 40, 0.7) 0%, rgba(18, 8, 26, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-pink-300/80 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-pink-300" />
              <span>Quick Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('all');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-pink-500/30 border border-pink-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📷 All
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('shared');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'shared'
                    ? 'bg-emerald-500/30 border border-emerald-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✨ Shared
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('private');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'private'
                    ? 'bg-purple-500/30 border border-purple-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🔒 Private
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-pink-400/15 flex items-center justify-between text-xs text-pink-300/80">
            <span className="font-serif italic text-pink-200/90 text-sm">
              Every picture is a bloom in our garden ♡
            </span>
            <span className="text-base">🌸</span>
          </div>
        </div>
      </section>

      {/* 4. Lightbox View Modal */}
      {lightboxMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-pink-300/80 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-pink-300" />
                <span>Memory Preview</span>
              </div>
              <button
                onClick={() => setLightboxMemory(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[380px] bg-black/40">
              <img
                src={lightboxMemory.photoUrl || '/assets/garden/card_archive.jpg'}
                alt={lightboxMemory.title}
                className="w-full h-full object-contain max-h-[380px] mx-auto"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-white">{lightboxMemory.title}</h3>
                <span className="text-xs font-mono text-pink-300/80">{lightboxMemory.dateTaken || 'Special Day'}</span>
              </div>

              {lightboxMemory.caption && (
                <p className="font-serif italic text-sm text-pink-200/90 leading-relaxed">
                  “{lightboxMemory.caption}” ♡
                </p>
              )}

              {lightboxMemory.description && (
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {lightboxMemory.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-pink-400/20 flex items-center justify-between gap-3">
              {lightboxMemory.contributorId === currentUser.id ? (
                <button
                  onClick={() => handleDelete(lightboxMemory)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Keepsake</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-pink-300/60">
                  Shared by {lightboxMemory.contributorName || partner.displayName}
                </span>
              )}

              <button
                onClick={() => setLightboxMemory(null)}
                className="btn-glow-romantic text-xs py-2 px-5"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Memory Modal Form */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                  <Camera className="w-4 h-4 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add a New Polaroid Keepsake
                  </h4>
                  <p className="text-[11px] text-pink-200/70 font-mono uppercase tracking-wider">
                    Snapshot to keep forever in our archive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-field-label">
                    <span>Title / Moment *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Evening by the Shore"
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Date Taken (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={dateTaken}
                    onChange={(e) => setDateTaken(e.target.value)}
                    placeholder="e.g. Oct 2026, Summer trip"
                  />
                </div>
              </div>

              <div>
                <label className="form-field-label">
                  <span>Photo URL *</span>
                </label>
                <input
                  type="text"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://... or /assets/garden/card_archive.jpg"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Short Caption / Sweet Thought</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. You looked so happy here..."
                />
              </div>

              {/* Privacy Toggle */}
              <div className="pt-2">
                <DecoratedPrivacyToggle
                  isShared={isShared}
                  onToggle={setIsShared}
                  partnerName={partner.displayName}
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-400/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Pin into Album ✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
