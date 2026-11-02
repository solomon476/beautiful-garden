import React, { useState, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Globe2,
  X,
  ZoomIn,
  Heart,
} from 'lucide-react';
import { memoryArchiveService, authService } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

const ROTATIONS = [
  'rotate-[-1.5deg] hover:rotate-0',
  'rotate-[1.8deg] hover:rotate-0',
  'rotate-[-2deg] hover:rotate-0',
  'rotate-[1.2deg] hover:rotate-0',
  'rotate-[-1deg] hover:rotate-0',
  'rotate-[2deg] hover:rotate-0',
];

export const LittleArchiveSection: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

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

  const handleDelete = async (m: MemoryEntry) => {
    if (m.contributorId !== currentUser.id) return;
    if (window.confirm(`Delete memory "${m.title}"?`)) {
      await memoryArchiveService.deleteMemory(m.id);
      await loadMemories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-pink-400/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/40 text-pink-200 text-xs font-mono uppercase tracking-widest shadow-sm">
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span>Our Little Archive</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient-garden">
            Scrapbook Moments & Added Keepsakes
          </h3>
          <p className="font-handwriting text-2xl text-pink-200/90 leading-relaxed max-w-xl">
            A growing polaroid album for snapshots, dates, and inside memories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-glow-romantic self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Snapshot</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass-midnight-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Pin a Snapshot to the Scrapbook
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                  Memory Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Afternoon Boba Run"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                  Date / Moment
                </label>
                <input
                  type="text"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  placeholder="e.g. Late Sunday, 2026"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                Photo URL or Image Link *
              </label>
              <input
                type="url"
                required
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... or /assets/..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                Handwritten Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A playful quote or inside joke..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                Story / Memory Details
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What made this moment memorable..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner resize-y font-light"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/25 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {isShared ? `Visible in shared scrapbook with ${partner.displayName}` : 'Kept in private album only'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 shadow-sm'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? 'Shared Memory ✨' : 'Make Private'}
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-300">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 border border-white/20"
              >
                Pin to Scrapbook 📷
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Archive Memories */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Flipping scrapbook pages...
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl text-white">Your Additional Album is Fresh</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            The core scrapbook on the main path remains preserved. Use this space to build and pin new polaroid snapshots over time.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-200 text-xs font-medium border border-pink-400/30 transition-all hover:scale-105"
          >
            Pin First Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {memories.map((m, index) => {
            const isMine = m.contributorId === currentUser.id;
            const rotClass = ROTATIONS[index % ROTATIONS.length];

            return (
              <div
                key={m.id}
                onClick={() => setLightboxMemory(m)}
                className={`polaroid-card group cursor-pointer transition-all duration-300 transform ${rotClass} hover:scale-103`}
              >
                {/* Washi tape visual detail */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-gradient-to-r from-pink-300/30 via-purple-300/40 to-pink-300/30 rounded-sm shadow-sm backdrop-blur-sm z-20 pointer-events-none transform -rotate-1" />

                <div className="polaroid-image-wrapper relative">
                  <img
                    src={m.photoUrl}
                    alt={m.title}
                    className="polaroid-image"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-pink-200 border border-white/20 flex items-center gap-1">
                    {m.isShared ? <Globe2 className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    <span>{m.isShared ? 'Shared' : 'Private'}</span>
                  </div>

                  <div className="absolute inset-0 bg-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2.5 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-4 h-4 text-pink-600" />
                    </span>
                  </div>
                </div>

                <div className="polaroid-caption">{m.title}</div>

                {m.caption && (
                  <p className="font-handwriting text-base text-pink-700/80 -mt-1 text-center line-clamp-1">
                    “{m.caption}”
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1.5 px-1">
                  <span>{m.dateTaken || 'Archive'}</span>
                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m);
                      }}
                      className="p-1 hover:text-rose-500 transition-colors opacity-70 hover:opacity-100"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation Polaroid Card */}
          {memories.length < 3 && (
            <div
              onClick={handleOpenAdd}
              className="polaroid-card group cursor-pointer transition-all duration-300 transform hover:scale-103 border-2 border-dashed border-pink-400/40 flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[320px] bg-white/5"
            >
              <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-slate-800">
                  Pin a Snapshot
                </h4>
                <p className="font-handwriting text-lg text-pink-700/80 max-w-[200px] leading-snug">
                  Add a photo from your latest adventure together...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-pink-500 text-white shadow-md shadow-pink-500/30 group-hover:scale-105 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Photo 📸
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className="max-w-xl w-full glass-midnight-card border border-pink-400/40 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6 sm:p-7 text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1 text-xs font-mono text-pink-300 uppercase">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                Scrapbook Memory
              </span>
              <button
                onClick={() => setLightboxMemory(null)}
                className="p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={lightboxMemory.photoUrl}
              alt={lightboxMemory.title}
              className="w-full max-h-80 object-cover rounded-2xl border border-white/15 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
              }}
            />

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
              {lightboxMemory.title}
            </h3>

            {lightboxMemory.caption && (
              <p className="font-handwriting text-2xl text-pink-200">
                “{lightboxMemory.caption}”
              </p>
            )}

            {lightboxMemory.description && (
              <p className="text-xs sm:text-sm text-slate-200/90 font-light leading-relaxed max-w-md mx-auto">
                {lightboxMemory.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-3 border-t border-purple-400/15">
              <span>Added by: {lightboxMemory.contributorId === currentUser.id ? 'You' : lightboxMemory.contributorName || partner.displayName}</span>
              <span>{lightboxMemory.dateTaken}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
