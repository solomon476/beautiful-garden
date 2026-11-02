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
} from 'lucide-react';
import { memoryArchiveService, authService } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Our Little Archive</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Personal Keepsakes & New Memories
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Add new polaroids, spontaneous snapshots, and memories to your private vault.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Memory</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Add a Snapshot to Archive
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Afternoon Tea Run"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Date / Moment
                </label>
                <input
                  type="text"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  placeholder="e.g. Summer Evening, 2026"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Photo URL or Asset Link *
              </label>
              <input
                type="url"
                required
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... or /assets/..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A quick, fun one-liner..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Full Story / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened, inside jokes, or why it matters..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="rounded text-pink-500 focus:ring-0"
                />
                <span>Share this memory with {partner.displayName} (Uncheck to keep private)</span>
              </label>
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md"
              >
                Save to Archive
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Archive Memories */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Opening archive...
        </div>
      ) : memories.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <Camera className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">No Additional Memories Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            The core scrapbook on the main path remains preserved. Use this archive space to build and share new memories over time.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Add a Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((m) => {
            const isMine = m.contributorId === currentUser.id;

            return (
              <div
                key={m.id}
                onClick={() => setLightboxMemory(m)}
                className="polaroid-card group cursor-pointer"
              >
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
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-pink-200 border border-white/20 flex items-center gap-1">
                    {m.isShared ? <Globe2 className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    <span>{m.isShared ? 'Shared' : 'Private'}</span>
                  </div>

                  <div className="absolute inset-0 bg-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2 rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform">
                      <ZoomIn className="w-4 h-4 text-pink-600" />
                    </span>
                  </div>
                </div>

                <div className="polaroid-caption">{m.title}</div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  <span>{m.dateTaken || 'Archive'}</span>
                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m);
                      }}
                      className="p-1 hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className="max-w-xl w-full bg-slate-900 border border-pink-400/30 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6 text-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
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
              className="w-full max-h-80 object-cover rounded-2xl border border-white/10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
              }}
            />

            <h3 className="font-serif text-2xl font-bold text-white mt-2">
              {lightboxMemory.title}
            </h3>

            {lightboxMemory.caption && (
              <p className="text-sm font-handwriting text-pink-200 text-xl">
                “{lightboxMemory.caption}”
              </p>
            )}

            {lightboxMemory.description && (
              <p className="text-xs text-slate-300 font-light leading-relaxed max-w-md mx-auto">
                {lightboxMemory.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2 border-t border-white/10">
              <span>Added by: {lightboxMemory.contributorId === currentUser.id ? 'You' : lightboxMemory.contributorName || partner.displayName}</span>
              <span>{lightboxMemory.dateTaken}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
