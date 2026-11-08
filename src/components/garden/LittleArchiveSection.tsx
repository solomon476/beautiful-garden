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
  RotateCw,
} from 'lucide-react';
import { memoryArchiveService, authService } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { compressImage } from '../../utils/imageCompressor';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';
import styles from './LittleArchiveSection.module.css';

export const formatMemoryDisplayTitle = (
  title: string,
  caption?: string,
  dateTaken?: string
): string => {
  if (!title) return 'Treasured Keepsake ♡';
  const trimmed = title.trim();

  // WhatsApp auto exports: e.g. "WhatsApp Image 2026-10-01 at 14.51.24(1)"
  const whatsAppMatch = trimmed.match(/^WhatsApp Image (\d{4}-\d{2}-\d{2})/i);
  if (whatsAppMatch) {
    if (caption && caption.trim().length > 0) return caption.trim();
    return `Special Day • ${whatsAppMatch[1]}`;
  }

  // Pure numbers: e.g. "65645", "30778", "66018"
  if (/^\d+$/.test(trimmed)) {
    if (caption && caption.trim().length > 0) return caption.trim();
    if (dateTaken && dateTaken !== 'Special Day') return `Memory from ${dateTaken}`;
    return 'Treasured Keepsake ♡';
  }

  // Raw file extensions: e.g. "IMG_20261001.jpg"
  if (/\.(jpe?g|png|webp|gif|heic)$/i.test(trimmed)) {
    if (caption && caption.trim().length > 0) return caption.trim();
    return trimmed.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }

  return trimmed;
};

export const LittleArchiveSection: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>(() =>
    memoryArchiveService.getCachedMemories()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Interactive Flip Cards (Touch to see note on picture)
  const [flippedMemories, setFlippedMemories] = useState<Record<string, boolean>>({});

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
      if (memories.length === 0) setLoading(true);
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
      setMemories((prev) => [newEntry, ...prev]);
      loadMemories();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save memory.');
    }
  };

  const handleDelete = async (memory: MemoryEntry) => {
    const displayTitle = formatMemoryDisplayTitle(memory.title, memory.caption, memory.dateTaken);
    if (window.confirm(`Delete keepsake "${displayTitle}"?`)) {
      soundEngine.playSparkle();
      await memoryArchiveService.deleteMemory(memory.id);
      setLightboxMemory(null);
      await loadMemories();
    }
  };

  const handleTouchCard = (id: string) => {
    soundEngine.playSparkle();
    setFlippedMemories((prev) => ({ ...prev, [id]: !prev[id] }));
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
    <div className={styles.archiveSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientBg} />
        <div className={styles.heroRadialGlow} />

        <div className={styles.heroContent}>
          {/* Left Decorative Artwork & Subtitles */}
          <div className={styles.heroLeft}>
            <div className={styles.heroArtwork}>
              <img
                src="/assets/garden/card_archive.jpg"
                alt="Our Little Archive"
              />
              <div className={styles.heroArtworkOverlay}>
                <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroTag}>
                <span>〰️ Our Little Archive</span>
                <span>✦</span>
              </div>

              <h2 className={styles.heroTitle}>
                <span>Our Little Archive</span>
                <span className={styles.heroTitleHeart}>♡</span>
              </h2>

              <p className={styles.heroSubtitle}>
                Photos, voice notes, and golden moments we will treasure forever.
              </p>

              <div className={styles.heroSubmeta}>
                Upload from Phone • Voice Notes • Memories
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className={styles.heroRightBtnWrapper}>
            <button
              type="button"
              onClick={handleOpenAdd}
              className={styles.heroRightActionBtn}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add a Photo Memory 📷</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Row */}
      <div className={styles.filterRow}>
        <div className={styles.filterPillsGroup}>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveFilter('all');
            }}
            className={`${styles.filterPill} ${
              activeFilter === 'all' ? styles.filterPillActiveAll : ''
            }`}
          >
            All Memories
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveFilter('shared');
            }}
            className={`${styles.filterPill} ${
              activeFilter === 'shared' ? styles.filterPillActiveShared : ''
            }`}
          >
            Shared ♡
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveFilter('private');
            }}
            className={`${styles.filterPill} ${
              activeFilter === 'private' ? styles.filterPillActivePrivate : ''
            }`}
          >
            My Private 🔒
          </button>
        </div>
      </div>

      {/* 2. Memories Grid */}
      {loading ? (
        <div className="py-16 text-center text-pink-300/60 text-xs font-mono animate-pulse">
          Opening the keepsake photo album...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyStateIcon}>
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className={styles.emptyStateTitle}>No photos in this view yet</h4>
          <p className={styles.emptyStateText}>
            Upload your favorite photos from your phone to preserve our beautiful journey.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className={styles.heroTriggerBtn}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload First Photo 📸</span>
          </button>
        </div>
      ) : (
        <div
          className={`${styles.memoriesGrid} ${
            filteredMemories.length >= 4 ? styles.memoriesGridMulti : styles.memoriesGridSingle
          }`}
        >
          {filteredMemories.map((mem) => {
            const isAddedByMe = mem.contributorId === currentUser.id;
            const displayTitle = formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken);
            const isFlipped = Boolean(flippedMemories[mem.id]);

            return (
              <div key={mem.id} className={styles.memoryCard}>
                {/* 3D Flip Photo Container (Touch to see note on picture) */}
                <div
                  className={styles.cardThumbContainer}
                  onClick={() => handleTouchCard(mem.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTouchCard(mem.id);
                    }
                  }}
                  aria-label={`Photo memory: ${displayTitle}. Touch to flip.`}
                >
                  <div className={`${styles.thumbFlipper} ${isFlipped ? styles.isFlipped : ''}`}>
                    {/* Front of Photo */}
                    <div className={styles.thumbFront}>
                      {/* Ambient Blur Backdrop (Eliminates harsh black bars) */}
                      <img
                        src={mem.photoUrl}
                        alt=""
                        aria-hidden="true"
                        className={styles.cardThumbAmbient}
                        loading="lazy"
                      />

                      {/* Main Photo (Heads, faces, and smiles centered at 15%) */}
                      <img
                        src={mem.photoUrl}
                        alt={displayTitle}
                        className={styles.cardThumbImage}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/garden/card_archive.jpg';
                        }}
                      />
                      <div className={styles.cardThumbOverlay} />

                      {/* Pinned Marker Badge */}
                      <span className={styles.pinnedBadge}>
                        <span>📌 Pinned</span>
                      </span>

                      {/* Privacy Badge */}
                      <span
                        className={`${styles.privacyPill} ${
                          mem.isShared ? styles.privacyPillShared : styles.privacyPillPrivate
                        }`}
                      >
                        {mem.isShared ? (
                          <Globe2 className="w-3 h-3 text-pink-300" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        <span>{mem.isShared ? 'Shared' : 'Private'}</span>
                      </span>

                      {/* Date Badge */}
                      {mem.dateTaken && (
                        <span className={styles.dateBadge}>
                          📅 {mem.dateTaken}
                        </span>
                      )}

                      {/* Touch To See Note Badge */}
                      <span className={styles.cardTapHint}>
                        <span>✍️ Touch for note</span>
                      </span>
                    </div>

                    {/* Back of Photo (Interactive Keepsake Note) */}
                    <div
                      className={styles.thumbBack}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Top Header */}
                      <div className={styles.thumbBackHeader}>
                        <span className="text-[10px] font-mono text-pink-300 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span>Keepsake Note 💌</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTouchCard(mem.id)}
                          className="p-1 rounded-full text-pink-300/80 hover:text-white transition-colors cursor-pointer"
                          title="Flip back to photo"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Clean Display Title */}
                      <h4 className={styles.thumbBackTitle} title={displayTitle}>
                        {displayTitle}
                      </h4>

                      {/* Handwritten Romantic Note */}
                      <div className={styles.thumbBackNoteCard}>
                        <p className={styles.thumbBackCaption}>
                          “{mem.caption || mem.description || 'A timeless moment in our love story.'}” ♡
                        </p>
                      </div>

                      {/* Submeta */}
                      <div className={styles.thumbBackMeta}>
                        <span>📅 {mem.dateTaken || 'Special Day'}</span>
                        <span className="text-pink-300">By {isAddedByMe ? 'You' : mem.contributorName || partner.displayName}</span>
                      </div>

                      {/* Action Buttons on Note */}
                      <div className={styles.thumbBackActions}>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playSparkle();
                            setLightboxMemory(mem);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" />
                          <span>Fullscreen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(mem)}
                          className="py-1 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTouchCard(mem.id)}
                          className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Flip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className={styles.cardBody}>
                  <div className={styles.cardMetaGroup}>
                    <h3
                      onClick={() => handleTouchCard(mem.id)}
                      className={styles.cardTitle}
                      title={displayTitle}
                    >
                      {displayTitle}
                    </h3>
                    {mem.caption && (
                      <p className={styles.cardCaption}>
                        “{mem.caption}” ♡
                      </p>
                    )}
                  </div>

                  {/* Voice Note if attached */}
                  {mem.voiceNoteUrl && (
                    <div style={{ paddingTop: '8px' }}>
                      <GardenAudioPlayer
                        src={mem.voiceNoteUrl}
                        title={`Voice Memo: ${displayTitle}`}
                        subtitle={`Recorded by ${mem.contributorName || 'Garden'}`}
                        isVoiceNote={true}
                      />
                    </div>
                  )}

                  {/* Footer Row */}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>
                      By: {isAddedByMe ? 'You' : mem.contributorName || partner.displayName}
                    </span>

                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => handleToggleReaction(mem)}
                        className={styles.reactionBtn}
                      >
                        {(mem as any).reaction || 'Precious! 💖'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playSparkle();
                          setLightboxMemory(mem);
                        }}
                        className={styles.zoomBtn}
                        title="View photo"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(mem)}
                        className={styles.cardDeleteBtn}
                        title="Delete keepsake"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          className={styles.modalBackdrop}
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className={styles.lightboxCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <Camera className="w-4 h-4 text-pink-300" />
                <h3 className="font-serif text-lg font-bold text-white truncate">
                  {formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMemory(null)}
                className={styles.modalCloseBtn}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={styles.lightboxImageStage}>
              <img
                src={lightboxMemory.photoUrl}
                alt=""
                aria-hidden="true"
                className={styles.cardThumbAmbient}
              />
              <img
                src={lightboxMemory.photoUrl}
                alt={formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}
              />
            </div>

            {lightboxMemory.caption && (
              <p className={styles.lightboxCaption}>
                “{lightboxMemory.caption}” ♡
              </p>
            )}

            {lightboxMemory.voiceNoteUrl && (
              <GardenAudioPlayer
                src={lightboxMemory.voiceNoteUrl}
                title={`Voice Note: ${formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}`}
                subtitle={`Recorded by ${lightboxMemory.contributorName || 'Garden'}`}
                isVoiceNote={true}
              />
            )}

            {/* Gallery Navigation Controls */}
            {filteredMemories.length > 1 && (
              <div className={styles.lightboxNavRow}>
                <button
                  type="button"
                  disabled={currentLightboxIdx <= 0}
                  onClick={() => {
                    if (currentLightboxIdx > 0) {
                      soundEngine.playSparkle();
                      setLightboxMemory(filteredMemories[currentLightboxIdx - 1]);
                    }
                  }}
                  className={styles.lightboxNavBtn}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className={styles.lightboxCounter}>
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
                  className={styles.lightboxNavBtn}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => handleDelete(lightboxMemory)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Memory</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxMemory(null)}
                className={styles.cancelBtn}
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
          className={styles.modalBackdrop}
          onClick={() => setIsAdding(false)}
        >
          <div
            className={styles.addModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
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
                type="button"
                onClick={() => setIsAdding(false)}
                className={styles.modalCloseBtn}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Choice Buttons */}
            <div className={styles.addModalUploadGrid}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.uploadChoiceBtn} ${
                  photoUrl ? styles.uploadChoiceBtnActive : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Choose Photo from Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(!showRecorder)}
                className={`${styles.uploadChoiceBtn} ${
                  showRecorder || voiceNoteUrl ? styles.uploadChoiceBtnActive : ''
                }`}
              >
                <Mic className="w-4 h-4" />
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
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors cursor-pointer"
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
                  className="text-slate-400 hover:text-rose-300 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Title / Moment *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Evening by the Shore"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Date Taken (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={dateTaken}
                    onChange={(e) => setDateTaken(e.target.value)}
                    placeholder="e.g. Oct 2026, Sunset"
                    className={styles.formInput}
                  />
                </div>
              </div>

              {!photoUrl && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Or Photo URL (Optional fallback)</span>
                  </label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... or choose from phone above"
                    className={styles.formInput}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Sweet Thought / Caption</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. The way the sunset glowed on your smile..."
                  className={styles.formInput}
                />
              </div>

              <div style={{ paddingTop: '4px' }}>
                <DecoratedPrivacyToggle
                  isShared={isShared}
                  onToggle={setIsShared}
                  partnerName={partner.displayName}
                />
              </div>

              {errorMsg && (
                <p className={styles.formError}>
                  {errorMsg}
                </p>
              )}

              <div className={styles.formFooter}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
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
