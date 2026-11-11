import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  X,
  ZoomIn,
  Sparkles,
  Upload,
  Mic,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  Heart,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Image as ImageIcon,
  Calendar,
  Film,
  Play,
  Loader2,
} from 'lucide-react';
import { memoryArchiveService, authService, DEFAULT_PROFILES } from '../../services/gardenService';
import type { MemoryEntry, UserProfile } from '../../types/garden';
import { giftContent } from '../../data/giftContent';
import { soundEngine } from '../../utils/audio';
import { compressImage, extractVideoThumbnail } from '../../utils/imageCompressor';
import { mediaStorage } from '../../utils/mediaStorage';
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
  const [memories, setMemories] = useState<MemoryEntry[]>(() => {
    const cached = memoryArchiveService.getCachedMemories();
    const seenIds = new Set<string>();
    const combined: MemoryEntry[] = [];
    for (const m of cached) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        combined.push(m);
      }
    }
    for (const gm of giftContent.memories) {
      if (!seenIds.has(gm.id)) {
        seenIds.add(gm.id);
        combined.push({
          id: gm.id,
          contributorId: DEFAULT_PROFILES.solomon.id,
          contributorName: DEFAULT_PROFILES.solomon.displayName,
          title: gm.title,
          caption: gm.caption,
          description: gm.caption,
          photoUrl: gm.photoUrl || '/assets/dreamy_night_garden.jpg',
          dateTaken: gm.date,
          isShared: true,
          createdAt: '2026-11-01T12:00:00.000Z',
        });
      }
    }
    return combined;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'private'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('grid');
  const [likedCards, setLikedCards] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    const isLiked = !likedCards[id];
    setLikedCards((prev) => ({ ...prev, [id]: isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || getInitialLikes(id)) + (isLiked ? 1 : -1),
    }));
  };

  const getInitialLikes = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
    return Math.abs(hash % 35) + 15;
  };

  const getInitialComments = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 3) - hash + id.charCodeAt(i);
    return Math.abs(hash % 8) + 1;
  };

  // Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [cloudVideoUrl, setCloudVideoUrl] = useState<string | undefined>(undefined);
  const [videoMediaId, setVideoMediaId] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [dateTaken, setDateTaken] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox preview
  const [lightboxMemory, setLightboxMemory] = useState<MemoryEntry | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const partner = authService.getPartner();

  const loadMemories = async () => {
    try {
      if (memories.length === 0) setLoading(true);
      const list = await memoryArchiveService.getMemories();
      const seenIds = new Set<string>();
      const combined: MemoryEntry[] = [];
      for (const m of list) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          combined.push(m);
        }
      }
      for (const gm of giftContent.memories) {
        if (!seenIds.has(gm.id)) {
          seenIds.add(gm.id);
          combined.push({
            id: gm.id,
            contributorId: DEFAULT_PROFILES.solomon.id,
            contributorName: DEFAULT_PROFILES.solomon.displayName,
            title: gm.title,
            caption: gm.caption,
            description: gm.caption,
            photoUrl: gm.photoUrl || '/assets/dreamy_night_garden.jpg',
            dateTaken: gm.date,
            isShared: true,
            createdAt: '2026-11-01T12:00:00.000Z',
          });
        }
      }
      setMemories(combined);
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
    window.addEventListener('garden-bin-updated', handleUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('garden-memories-updated', handleUpdate);
      window.removeEventListener('garden-bin-updated', handleUpdate);
    };
  }, []);

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setCaption('');
    setDescription('');
    setPhotoUrl('');
    setVideoUrl(undefined);
    setCloudVideoUrl(undefined);
    setVideoMediaId(undefined);
    setMediaType('photo');
    setVideoDuration(undefined);
    setIsProcessingMedia(false);
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
      setVideoUrl(undefined);
      setMediaType('photo');
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image file.');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 120 * 1024 * 1024) {
      setErrorMsg('Video file is larger than 120MB. Please choose a shorter video clip.');
      return;
    }

    try {
      soundEngine.playSparkle();
      setIsProcessingMedia(true);
      setErrorMsg(null);

      // 1. Extract instant frame as poster thumbnail & calculate duration
      const { thumbnailUrl, duration } = await extractVideoThumbnail(file);
      setPhotoUrl(thumbnailUrl);
      setVideoDuration(duration);

      // 2. Store video in local IndexedDB media database
      const saved = await mediaStorage.saveFile(file, file.name);
      setVideoUrl(saved.blobUrl || saved.dataUrl);
      setVideoMediaId(saved.id);
      setMediaType('video');

      // 3. For video clips under 7MB, read base64 data URL for cross-device cloud sync to partner
      if (file.size <= 7 * 1024 * 1024) {
        try {
          const syncDataUrl = await mediaStorage.readFileAsDataUrl(file);
          setCloudVideoUrl(syncDataUrl);
        } catch (e) {
          console.warn('[VideoUpload] Could not generate base64 for cloud sync:', e);
        }
      } else {
        setCloudVideoUrl(undefined);
      }

      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error('[VideoUpload] Failed to process video:', err);
      setErrorMsg('Failed to process video file. Please try another video format (MP4, MOV, WebM).');
    } finally {
      setIsProcessingMedia(false);
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
    if (!photoUrl.trim() && !videoUrl) {
      setErrorMsg('Please select a photo or video from your phone.');
      return;
    }

    try {
      const newEntry = await memoryArchiveService.addMemory({
        title,
        caption,
        description,
        photoUrl: photoUrl || '/assets/garden/card_archive.jpg',
        videoUrl: cloudVideoUrl || videoUrl,
        videoMediaId,
        mediaType,
        voiceNoteUrl,
        audioFileName,
        dateTaken: dateTaken || 'Special Day',
        isShared,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setIsAdding(false);
      // For immediate local display, preserve the instant blobUrl
      const localPlayableEntry: MemoryEntry = {
        ...newEntry,
        videoUrl: videoUrl || newEntry.videoUrl,
      };
      setMemories((prev) => [localPlayableEntry, ...prev.filter((m) => m.id !== newEntry.id)]);
      loadMemories();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save memory.');
    }
  };

  const handleDelete = async (memory: MemoryEntry) => {
    const displayTitle = formatMemoryDisplayTitle(memory.title, memory.caption, memory.dateTaken);
    if (window.confirm(`Move "${displayTitle}" to Recycle Bin? You can restore it anytime from the More tab.`)) {
      soundEngine.playSparkle();
      setLightboxMemory(null);
      // Instantly remove from state for real-time visual feedback
      setMemories((prev) => prev.filter((m) => m.id !== memory.id));
      await memoryArchiveService.deleteMemory(memory.id);
      await loadMemories();
    }
  };

  const deletedIds = new Set(memoryArchiveService.getDeletedMemoryIds());
  const filteredMemories = memories
    .filter((m) => !deletedIds.has(m.id))
    .filter((m) => {
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
      {/* 1. Top Banner Button — Matching Mockup Reference */}
      <div
        onClick={handleOpenAdd}
        className="add-memory-banner group"
        title="Pin a Photo or Video to Our Album"
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="font-bold text-base text-white tracking-wide leading-tight flex items-center gap-1.5">
            <span>Pin a Photo or Video to Our Album</span>
            <span className="text-pink-300">📸 🎬</span>
          </h3>
          <p className="text-xs text-pink-200/90 font-serif italic mt-0.5 leading-tight">
            Add photos, video clips, and voice memories ♡
          </p>
        </div>
      </div>

      {/* 2. View Switcher Tabs — Matching Mockup Reference */}
      <div className="archive-tabs">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('cards');
          }}
          className={`archive-tab ${viewMode === 'cards' ? 'active' : ''}`}
        >
          <Layers className={`w-4 h-4 ${viewMode === 'cards' ? 'text-white' : 'text-pink-300'}`} />
          <div className="text-left">
            <div className="leading-tight">Keepsake Cards</div>
            <div className="text-[10px] opacity-80 font-normal leading-tight mt-0.5">Clear Notes</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setViewMode('grid');
          }}
          className={`archive-tab ${viewMode === 'grid' ? 'active' : ''}`}
        >
          <LayoutGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-white' : 'text-purple-300'}`} />
          <div className="text-left">
            <div className="leading-tight">Mini Grid</div>
            <div className="text-[10px] opacity-80 font-normal leading-tight mt-0.5">Compact View ✨</div>
          </div>
        </button>
      </div>

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

      {/* 3. Memories Display */}
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
      ) : viewMode === 'grid' ? (
        /* ================= Mini Grid Mode (Horizontal Split Glass Cards) ================= */
        <div className="archive-memory-grid">
          {filteredMemories.map((mem) => {
            const isAddedByMe = mem.contributorId === currentUser.id;
            const displayTitle = formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken);
            const isLiked = Boolean(likedCards[mem.id]);
            const count = likeCounts[mem.id] || getInitialLikes(mem.id);
            const comments = getInitialComments(mem.id);
            const categoryTag = (mem as any).category || (mem.isShared ? 'Moment' : 'Private');

            return (
              <div
                key={mem.id}
                className="archive-card group"
                onClick={() => {
                  soundEngine.playSparkle();
                  setLightboxMemory(mem);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    soundEngine.playSparkle();
                    setLightboxMemory(mem);
                  }
                }}
              >
                {/* Left Side: Photo with Heart & Count Badges */}
                <div className="archive-card-image-wrap">
                  <img
                    src={mem.photoUrl}
                    alt={displayTitle}
                    className="archive-card-image"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/garden/card_archive.jpg';
                    }}
                  />

                  {/* Video Play Icon Overlay */}
                  {mem.videoUrl && (
                    <div className={styles.videoPlayBadgeOverlay}>
                      <div className={styles.videoPlayIconCircle}>
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(mem.id, e)}
                    className="archive-card-favourite"
                    title={isLiked ? 'Loved!' : 'Love this memory'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-transform ${
                        isLiked ? 'fill-pink-400 text-pink-400 scale-110' : 'text-white'
                      }`}
                    />
                  </button>

                  {/* Photo or Video count badge */}
                  {mem.videoUrl ? (
                    <div className="archive-card-photo-count bg-black/70 text-amber-200 border border-amber-300/40">
                      <Film className="w-2.5 h-2.5 text-amber-300" />
                      <span>Video</span>
                    </div>
                  ) : (
                    <div className="archive-card-photo-count">
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>1</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Details & Romantic Note */}
                <div className="archive-card-details">
                  {/* Category Pill & Menu */}
                  <div className="archive-card-header-row">
                    <span className="archive-card-category truncate max-w-[110px]">
                      {categoryTag}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playSparkle();
                        setLightboxMemory(mem);
                      }}
                      className="text-slate-300 hover:text-white p-1 rounded-full cursor-pointer"
                      title="View memory"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title in Caveat Cursive Font */}
                  <h3 className="archive-card-title truncate" title={displayTitle}>
                    {displayTitle}
                  </h3>

                  {/* Note Caption Preview */}
                  <p
                    className="archive-card-note line-clamp-2"
                    title={mem.caption || mem.description || 'A timeless moment in our love story.'}
                  >
                    “{mem.caption || mem.description || 'A timeless moment in our love story.'}” ♡
                  </p>

                  {/* Date */}
                  <div className="archive-card-date">
                    <Calendar className="w-3 h-3 text-pink-300/80" />
                    <span>{mem.dateTaken || 'Special Day'}</span>
                  </div>

                  {/* Voice note if attached */}
                  {mem.voiceNoteUrl && (
                    <div className="my-1" onClick={(e) => e.stopPropagation()}>
                      <GardenAudioPlayer
                        src={mem.voiceNoteUrl}
                        title={`Voice Memo: ${displayTitle}`}
                        subtitle={`Recorded by ${mem.contributorName || 'Garden'}`}
                        isVoiceNote={true}
                      />
                    </div>
                  )}

                  {/* Footer Stats & Actions */}
                  <div className="archive-card-footer">
                    <div className="archive-card-stats">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(mem.id, e)}
                        className="archive-card-stat-btn text-pink-300 hover:text-pink-200"
                      >
                        <Heart
                          className={`w-3 h-3 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`}
                        />
                        <span>{count}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSparkle();
                          setLightboxMemory(mem);
                        }}
                        className="archive-card-stat-btn text-purple-300 hover:text-purple-200"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{comments}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAddedByMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(mem);
                          }}
                          className="text-rose-300/70 hover:text-rose-300 p-0.5 cursor-pointer"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSparkle();
                          setLightboxMemory(mem);
                        }}
                        className="text-slate-300 hover:text-pink-300 p-0.5 cursor-pointer"
                        title="Fullscreen"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtle corner blossom decoration */}
                <span className="cherry-blossom-corner">🌸</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= Keepsake Cards Mode (Full Notes Luxury View) ================= */
        <div className="space-y-6 max-w-xl mx-auto">
          {filteredMemories.map((mem) => {
            const isAddedByMe = mem.contributorId === currentUser.id;
            const displayTitle = formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken);
            const isLiked = Boolean(likedCards[mem.id]);
            const count = likeCounts[mem.id] || getInitialLikes(mem.id);

            return (
              <div
                key={mem.id}
                className="keepsake-album-card group cursor-pointer"
                onClick={() => {
                  soundEngine.playSparkle();
                  setLightboxMemory(mem);
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-pink-300/20">
                  <span className="keepsake-album-label flex items-center gap-1.5">
                    <span>Keepsake Note 💌</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-pink-200/80">
                    <Calendar className="w-3 h-3 text-pink-300" />
                    <span>{mem.dateTaken || 'Special Day'}</span>
                  </div>
                </div>

                {/* Photo Preview in Keepsake Card */}
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden my-4 border border-pink-300/30 shadow-md">
                  <img
                    src={mem.photoUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/garden/card_archive.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white border border-white/20">
                    {mem.isShared ? 'Shared ♡' : 'Private 🔒'}
                  </div>

                  {/* Video Play Icon Overlay */}
                  {mem.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg border-2 border-white/90">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Video Clip Badge */}
                  {mem.videoUrl && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-mono text-amber-200 border border-amber-300/40 flex items-center gap-1.5 z-10">
                      <Film className="w-3 h-3 text-amber-300" />
                      <span>Video Clip</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playSparkle();
                      setLightboxMemory(mem);
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-pink-500 transition-colors z-10"
                    title="Fullscreen"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Title in Caveat */}
                <h3 className="keepsake-album-title">
                  {displayTitle}
                </h3>

                {/* Complete Unclipped Romantic Note */}
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-pink-300/30 my-2">
                  <p className="keepsake-album-text">
                    “{mem.caption || mem.description || 'A timeless moment in our love story.'}” ♡
                  </p>
                </div>

                {/* Voice Note if attached */}
                {mem.voiceNoteUrl && (
                  <div className="my-2" onClick={(e) => e.stopPropagation()}>
                    <GardenAudioPlayer
                      src={mem.voiceNoteUrl}
                      title={`Voice Memo: ${displayTitle}`}
                      subtitle={`Recorded by ${mem.contributorName || 'Garden'}`}
                      isVoiceNote={true}
                    />
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-pink-300/20 text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(mem.id, e)}
                    className="flex items-center gap-1.5 text-pink-300 hover:text-pink-200 font-semibold"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                    <span>{count} Loves</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isAddedByMe && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mem);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-medium flex items-center gap-1 transition-all"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playSparkle();
                        setLightboxMemory(mem);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Fullscreen</span>
                    </button>
                  </div>
                </div>

                <span className="cherry-blossom-corner">🌸</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Button — Matching Mockup */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="add-new-moment-btn"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>Add a New Moment ✨</span>
        </button>
      </div>

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
              {lightboxMemory.videoUrl ? (
                <video
                  key={lightboxMemory.id}
                  src={lightboxMemory.videoUrl}
                  poster={lightboxMemory.photoUrl}
                  controls
                  playsInline
                  autoPlay
                  preload="auto"
                  className={styles.lightboxVideo}
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = e.currentTarget;
                    if (v.paused) v.play().catch(() => {});
                    else v.pause();
                  }}
                />
              ) : (
                <img
                  src={lightboxMemory.photoUrl}
                  alt={formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}
                  className={styles.lightboxMainImage}
                />
              )}
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
                <span>Move to Bin</span>
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
                  photoUrl && !videoUrl ? styles.uploadChoiceBtnActive : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo 📸</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={`${styles.uploadChoiceBtn} ${
                  videoUrl ? styles.uploadChoiceBtnActive : ''
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Upload Video 🎬</span>
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

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />

            {/* Processing Video Spinner */}
            {isProcessingMedia && (
              <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-400/30 flex items-center justify-center gap-3 text-xs text-pink-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-pink-300" />
                <span>Processing video clip & generating keepsake poster frame... ✨</span>
              </div>
            )}

            {/* Voice Recorder */}
            {showRecorder && (
              <VoiceNoteRecorder
                onRecorded={handleVoiceNoteRecorded}
                onCancel={() => setShowRecorder(false)}
              />
            )}

            {/* Video Preview */}
            {videoUrl && (
              <div className="relative rounded-2xl overflow-hidden max-h-60 border border-pink-400/30 shadow-md bg-black/60">
                <video
                  src={videoUrl}
                  poster={photoUrl}
                  controls
                  playsInline
                  className="w-full max-h-60 object-contain mx-auto"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-mono text-pink-200 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-pink-300" />
                  <span>Video Clip {videoDuration ? `(${Math.round(videoDuration)}s)` : ''}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl(undefined);
                    setMediaType('photo');
                    setPhotoUrl('');
                    setVideoDuration(undefined);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                  title="Remove video"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Photo Preview (when photo selected and no video) */}
            {photoUrl && !videoUrl && (
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
