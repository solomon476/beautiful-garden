import React, { useState, useEffect } from 'react';
import {
  Camera,
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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-pink-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
            <Camera className="w-3 h-3 text-pink-300" />
            <span>Our Little Archive</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Scrapbook Moments & Added Keepsakes
          </h3>
          <p className="text-xs sm:text-sm text-pink-200/80 font-light leading-relaxed max-w-xl">
            A growing polaroid album for snapshots, dates, and inside memories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-glow-romantic shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Snapshot</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass-midnight-card max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] space-y-6 sm:space-y-7 animate-fade-in relative overflow-hidden border border-pink-400/35 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                <Camera className="w-4 h-4 text-pink-300" />
              </span>
              <div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                  Pin a Snapshot to the Scrapbook
                </h4>
                <p className="text-[11px] text-pink-200/70 font-mono uppercase tracking-wider">
                  Shared Keepsake Polaroid Entry
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

          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="form-field-label">
                  <span>Memory Title *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Afternoon Boba Run"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Date or Moment</span>
                </label>
                <input
                  type="text"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  placeholder="e.g. Late Sunday, 2026"
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">
                <span>Photo URL or Image Link *</span>
              </label>
              <input
                type="url"
                required
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... or /assets/..."
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Handwritten Caption</span>
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="A playful quote, memory title, or inside joke..."
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Story or Special Details</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What made this moment memorable... (take as much room as you need)"
              />
            </div>

            {/* Eye-Catching Decorated Privacy Toggle */}
            <DecoratedPrivacyToggle
              isShared={isShared}
              onToggle={setIsShared}
              partnerName={partner.displayName}
              sharedTitle={`Visible in Shared Scrapbook with ${partner.displayName}`}
              sharedSubtitle={`Both you and ${partner.displayName} will see this photo blossom in your shared album ✨`}
              privateTitle="Private Album Keepsake (Only You)"
              privateSubtitle="Kept hidden in your private gallery. Sealed from partner's view 🔒"
            />

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
              <button
                type="submit"
                className="btn-glow-romantic"
              >
                <Camera className="w-4 h-4" />
                <span>Pin to Scrapbook ✨</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Archive Memories */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Flipping scrapbook pages...
        </div>
      ) : memories.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-2xl text-center space-y-3.5 border border-pink-400/25">
          <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <Camera className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-xl text-white">Your Additional Album is Fresh</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            The core scrapbook on the main path remains preserved. Use this space to build and pin new polaroid snapshots over time.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin First Memory</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
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
                <div className="washi-tape" />

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
                      aria-label={`Delete ${m.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation Polaroid Card */}
          {memories.length < 4 && (
            <div
              onClick={handleOpenAdd}
              className="polaroid-card group cursor-pointer transition-all duration-300 transform hover:scale-103 border-2 border-dashed border-pink-400/40 flex flex-col items-center justify-center p-6 text-center space-y-3 min-h-[300px] bg-white/5"
            >
              <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-slate-800">
                  Pin a Snapshot
                </h4>
                <p className="font-handwriting text-base text-pink-700/80 max-w-[180px] leading-snug">
                  Add a photo from your latest adventure together...
                </p>
              </div>
              <span className="btn-glow-romantic text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Photo
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
