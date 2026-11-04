import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Lock,
  Globe2,
  X,
  ZoomIn,
  Sparkles,
  Upload,
  Mic,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { memoryArchiveService, authService } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { mediaStorage } from '../../utils/mediaStorage';
import { compressImage } from '../../utils/imageCompressor';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';

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
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [dateTaken, setDateTaken] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox preview
  const [lightboxMemory, setLightboxMemory] = useState<MemoryEntry | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    const handleUpdate = () => loadMemories();
    window.addEventListener('garden-memories-updated', handleUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('garden-memories-updated', handleUpdate);
    };
  }, []);

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setCaption('');
    setDescription('');
    setPhotoUrl('');
    setVoiceNoteUrl(undefined);
    setAudioFileName(undefined);
    setShowRecorder(false);
    setDateTaken('');
    setIsShared(true);
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      soundEngine.playSparkle();
      const compressedDataUrl = await compressImage(file, 1280, 1280, 0.82);
      setPhotoUrl(compressedDataUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image file.');
    }
  };

  const handleVoiceNoteRecorded = (dataUrl: string, _durationSec: number, name: string) => {
    soundEngine.playSparkle();
    setVoiceNoteUrl(dataUrl);
    setAudioFileName(name);
    setShowRecorder(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please provide a title for this moment.');
      return;
    }
    if (!photoUrl.trim()) {
      setErrorMsg('Please select a photo from your phone or provide an image URL.');
      return;
    }

    try {
      const newEntry = await memoryArchiveService.addMemory({
        title,
        caption,
        description,
        photoUrl,
        voiceNoteUrl,
        audioFileName,
        dateTaken: dateTaken || 'Special Day',
        isShared,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setIsAdding(false);
      // Immediately prepend to visible list so user sees it right away
      setMemories((prev) => [newEntry, ...prev]);
      // Then silently refresh from cloud in background
      loadMemories();
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

  const currentLightboxIdx = lightboxMemory
    ? filteredMemories.findIndex((m) => m.id === lightboxMemory.id)
    : -1;

  useEffect(() => {
    if (!lightboxMemory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxMemory(null);
      } else if (e.key === 'ArrowLeft') {
        const idx = filteredMemories.findIndex((m) => m.id === lightboxMemory.id);
        if (idx > 0) {
          soundEngine.playSparkle();
          setLightboxMemory(filteredMemories[idx - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const idx = filteredMemories.findIndex((m) => m.id === lightboxMemory.id);
        if (idx >= 0 && idx < filteredMemories.length - 1) {
          soundEngine.playSparkle();
          setLightboxMemory(filteredMemories[idx + 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMemory, filteredMemories]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner */}
      <section
        className="relative rounded-3xl overflow-hidden border border-pink-400/30 shadow-2xl p-5 sm:p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 16, 44, 0.94) 0%, rgba(20, 8, 28, 0.98) 100%)',
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_archive.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(192, 132, 252, 0.25) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 w-full">
          {/* Left Decorative Artwork & Subtitles */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-pink-300/40 shadow-xl shrink-0 group">
              <img
                src="/assets/garden/card_archive.jpg"
                alt="Our Little Archive"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Our Little Archive</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Our Little Archive</span>
                <span className="text-pink-400 font-sans text-xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-xs sm:text-base text-pink-200/90 max-w-xl leading-relaxed">
                Photos, voice notes, and golden moments we will treasure forever.
              </p>

              <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-pink-300/70 pt-0.5">
                Upload from Phone • Voice Notes • Memories
              </div>

              {/* Direct Left Column Add Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Upload Photo Memory 📷</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 w-full sm:w-auto flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-2.5 sm:py-3 px-5 sm:px-6 shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add a Photo Memory 📷</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(['all', 'shared', 'private'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                soundEngine.playSparkle();
                setActiveFilter(f);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-pink-500/30 border border-pink-400/60 text-white shadow-md'
                  : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {f === 'all' && 'All Memories'}
              {f === 'shared' && 'Shared ♡'}
              {f === 'private' && 'My Private 🔒'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Memories Grid */}
      {loading ? (
        <div className="py-16 text-center text-pink-300/60 text-xs font-mono animate-pulse">
          Opening the keepsake photo album...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="glass-midnight-card p-8 sm:p-10 rounded-3xl text-center space-y-4 border border-pink-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl sm:text-2xl text-white">No photos in this view yet</h4>
          <p className="text-xs sm:text-sm text-pink-200/80 max-w-md mx-auto font-light leading-relaxed">
            Upload your favorite photos from your phone to preserve our beautiful journey.
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Upload First Photo 📸</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredMemories.map((mem) => {
            const isAddedByMe = mem.contributorId === currentUser.id;

            return (
              <div
                key={mem.id}
                className="group relative rounded-3xl overflow-hidden bg-[#160b28]/85 border border-pink-400/20 hover:border-pink-400/50 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div
                  onClick={() => {
                    soundEngine.playSparkle();
                    setLightboxMemory(mem);
                  }}
                  className="relative aspect-4/3 w-full overflow-hidden cursor-pointer"
                >
                  <img
                    src={mem.photoUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/dreamy_night_garden.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#160b28] via-transparent to-black/30" />

                  {/* Pinned Marker Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md border border-white/20 text-pink-200">
                      <span>📌 Pinned</span>
                    </span>
                  </div>

                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono backdrop-blur-md border ${
                        mem.isShared
                          ? 'bg-pink-500/30 border-pink-400/40 text-pink-200'
                          : 'bg-white/10 border-white/20 text-slate-300'
                      }`}
                    >
                      {mem.isShared ? <Globe2 className="w-3 h-3 text-pink-300" /> : <Lock className="w-3 h-3" />}
                      <span>{mem.isShared ? 'Shared' : 'Private'}</span>
                    </span>
                  </div>

                  {/* Date Badge */}
                  {mem.dateTaken && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-mono text-pink-200/90 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                        📅 {mem.dateTaken}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3
                      onClick={() => setLightboxMemory(mem)}
                      className="font-serif text-lg font-bold text-white group-hover:text-pink-200 transition-colors cursor-pointer truncate"
                    >
                      {mem.title}
                    </h3>
                    {mem.caption && (
                      <p className="text-xs text-pink-100/90 font-serif italic line-clamp-2 leading-relaxed">
                        “{mem.caption}” ♡
                      </p>
                    )}
                  </div>

                  {/* Voice Note if attached */}
                  {mem.voiceNoteUrl && (
                    <div className="pt-2">
                      <GardenAudioPlayer
                        src={mem.voiceNoteUrl}
                        title={`Voice Memo: ${mem.title}`}
                        subtitle={`Recorded by ${mem.contributorName || 'Garden'}`}
                        isVoiceNote={true}
                      />
                    </div>
                  )}

                  {/* Footer Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-pink-300/80">
                      By: {isAddedByMe ? 'You' : mem.contributorName || partner.displayName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleReaction(mem)}
                        className="px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 text-[10px] text-pink-200 active:scale-95"
                      >
                        {(mem as any).reaction || 'Precious! 💖'}
                      </button>

                      <button
                        onClick={() => setLightboxMemory(mem)}
                        className="p-1 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white"
                        title="View photo"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Lightbox Modal */}
      {lightboxMemory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className="max-w-3xl w-full rounded-3xl overflow-hidden bg-[#160b28] border border-pink-400/40 shadow-2xl relative space-y-4 p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-300" />
                <h3 className="font-serif text-lg font-bold text-white truncate">
                  {lightboxMemory.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxMemory(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[60vh] bg-black flex items-center justify-center p-1">
              <img
                src={lightboxMemory.photoUrl}
                alt={lightboxMemory.title}
                className="max-h-[60vh] max-w-full w-auto object-contain mx-auto select-none rounded-lg"
              />
            </div>

            {lightboxMemory.caption && (
              <p className="text-sm text-pink-100 font-serif italic text-center">
                “{lightboxMemory.caption}” ♡
              </p>
            )}

            {lightboxMemory.voiceNoteUrl && (
              <GardenAudioPlayer
                src={lightboxMemory.voiceNoteUrl}
                title={`Voice Note: ${lightboxMemory.title}`}
                subtitle={`Recorded by ${lightboxMemory.contributorName || 'Garden'}`}
                isVoiceNote={true}
              />
            )}

            {/* Gallery Navigation Controls */}
            {filteredMemories.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <button
                  type="button"
                  disabled={currentLightboxIdx <= 0}
                  onClick={() => {
                    if (currentLightboxIdx > 0) {
                      soundEngine.playSparkle();
                      setLightboxMemory(filteredMemories[currentLightboxIdx - 1]);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="text-[11px] font-mono text-purple-200/70">
                  {currentLightboxIdx + 1} of {filteredMemories.length}
                </span>

                <button
                  type="button"
                  disabled={currentLightboxIdx >= filteredMemories.length - 1}
                  onClick={() => {
                    if (currentLightboxIdx < filteredMemories.length - 1) {
                      soundEngine.playSparkle();
                      setLightboxMemory(filteredMemories[currentLightboxIdx + 1]);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              {lightboxMemory.contributorId === currentUser.id ? (
                <button
                  onClick={() => handleDelete(lightboxMemory)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <span className="text-pink-300 font-mono">
                  From {lightboxMemory.contributorName}
                </span>
              )}

              <button
                onClick={() => setLightboxMemory(null)}
                className="btn-glow-romantic text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Memory Form Modal */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                  <Camera className="w-4 h-4 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add Moment to Little Archive
                  </h4>
                  <p className="text-[11px] text-pink-200/70 font-mono uppercase tracking-wider">
                    Upload from phone camera or gallery
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

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  photoUrl
                    ? 'bg-pink-500/25 border-pink-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-pink-200 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4 text-pink-300" />
                <span>Choose Photo from Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(!showRecorder)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  showRecorder || voiceNoteUrl
                    ? 'bg-purple-500/25 border-purple-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-purple-200 hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4 text-purple-300" />
                <span>Record Voice Note</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Voice Recorder */}
            {showRecorder && (
              <VoiceNoteRecorder
                onRecorded={handleVoiceNoteRecorded}
                onCancel={() => setShowRecorder(false)}
              />
            )}

            {/* Photo Preview */}
            {photoUrl && (
              <div className="relative rounded-2xl overflow-hidden max-h-52 border border-white/20 shadow-md">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Voice Note Preview */}
            {voiceNoteUrl && (
              <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-between text-xs text-purple-200">
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-300" />
                  <span>Voice Note Attached</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceNoteUrl(undefined)}
                  className="text-slate-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    placeholder="e.g. Oct 2026, Sunset"
                  />
                </div>
              </div>

              {!photoUrl && (
                <div>
                  <label className="form-field-label">
                    <span>Or Photo URL (Optional fallback)</span>
                  </label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... or choose from phone above"
                  />
                </div>
              )}

              <div>
                <label className="form-field-label">
                  <span>Sweet Thought / Caption</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. The way the sunset glowed on your smile..."
                />
              </div>

              <div className="pt-1">
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-400/20">
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
