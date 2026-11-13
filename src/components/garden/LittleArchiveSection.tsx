import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Plus,
  X,
  ZoomIn,
  Sparkles,
  Upload,
  Mic,
  Music2,
  Disc3,
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
  Pause,
  Loader2,
} from 'lucide-react';
import { memoryArchiveService, soundGardenService, authService, DEFAULT_PROFILES } from '../../services/gardenService';
import type { MemoryEntry, UserProfile, SongEntry } from '../../types/garden';
import { giftContent } from '../../data/giftContent';
import { soundEngine } from '../../utils/audio';
import { compressImageWithStats, extractVideoThumbnail, type CompressionResult } from '../../utils/imageCompressor';
import { mediaStorage } from '../../utils/mediaStorage';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';
import { OnThisDayTimeMachine } from './OnThisDayTimeMachine';
import { getOnThisDayFlashbacks } from '../../services/onThisDayService';
import { notificationService } from '../../services/notificationService';
import { generateRomanticMetadata, isRawMachineName } from '../../services/aiCaptionService';
import { fetchSpotifyOEmbed, isSpotifyUrl } from '../../utils/spotify';
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
    if (cached.length > 0) {
      return cached;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = memoryArchiveService.getCachedMemories();
    return cached.length === 0;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'private'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('grid');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [likeNotificationToast, setLikeNotificationToast] = useState<string | null>(null);
  const [lastLikedMemoryId, setLastLikedMemoryId] = useState<string | null>(null);
  const [likedCards, setLikedCards] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Soundtrack / Music state
  const [musicUrl, setMusicUrl] = useState<string | undefined>(undefined);
  const [musicTitle, setMusicTitle] = useState<string | undefined>(undefined);
  const [musicArtist, setMusicArtist] = useState<string | undefined>(undefined);
  const [showMusicPicker, setShowMusicPicker] = useState<boolean>(false);
  const [availableSongs, setAvailableSongs] = useState<SongEntry[]>([]);
  const [customSpotifyUrl, setCustomSpotifyUrl] = useState<string>('');
  const [isCheckingSpotify, setIsCheckingSpotify] = useState<boolean>(false);
  const [isPlayingSoundtrack, setIsPlayingSoundtrack] = useState<boolean>(false);
  const soundtrackAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);

  const flashbacks = useMemo(() => getOnThisDayFlashbacks(memories), [memories]);

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    const isLiked = !likedCards[id];
    setLikedCards((prev) => ({ ...prev, [id]: isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || getInitialLikes(id)) + (isLiked ? 1 : -1),
    }));

    if (isLiked) {
      const mem = memories.find((m) => m.id === id);
      const displayTitle = mem ? formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken) : 'Memory';
      const partner = authService.getPartner();
      const user = authService.getCurrentUser();

      // Realtime notification to partner
      notificationService.sendNotification({
        type: 'memory',
        title: '❤️ Liked a Photo',
        message: `${user.displayName} liked "${displayTitle}" in Our Archive! ♡`,
        targetTab: 'archive',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partner.id,
        entityId: id,
      });

      // Immediate confirmation to self
      setLastLikedMemoryId(id);
      setLikeNotificationToast(`❤️ You liked "${displayTitle}"! Tap to view ✨`);
      setTimeout(() => setLikeNotificationToast(null), 4000);
    }
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox preview
  const [lightboxMemory, setLightboxMemory] = useState<MemoryEntry | null>(null);
  const [isRecordingWhisper, setIsRecordingWhisper] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const partner = authService.getPartner();

  const loadMemories = async () => {
    try {
      if (memories.length === 0) setLoading(true);
      const list = await memoryArchiveService.getMemories();
      const seenIds = new Set<string>();
      const seenMedia = new Set<string>();
      const combined: MemoryEntry[] = [];
      for (const m of list) {
        const mediaKey = m.videoMediaId || m.videoUrl || m.photoUrl || m.id;
        if (!seenIds.has(m.id) && !seenMedia.has(mediaKey)) {
          seenIds.add(m.id);
          seenMedia.add(mediaKey);
          combined.push(m);
        }
      }
      // Only include fallback sample memories if zero memories have been uploaded yet
      if (combined.length === 0) {
        for (const gm of giftContent.memories) {
          const mediaKey = gm.videoMediaId || gm.videoUrl || gm.photoUrl || gm.id;
          if (!seenIds.has(gm.id) && !seenMedia.has(mediaKey)) {
            seenIds.add(gm.id);
            seenMedia.add(mediaKey);
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
    const handleUpdate = () => {
      loadMemories();
    };
    window.addEventListener('garden-memories-updated', handleUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('garden-memories-updated', handleUpdate);
    };
  }, []);

  // Listen for direct navigation to a specific liked or referenced memory
  useEffect(() => {
    const openTargetMemory = (targetId: string) => {
      if (!targetId || memories.length === 0) return;
      const found = memories.find((m) => m.id === targetId);
      if (found) {
        sessionStorage.removeItem('pending_open_memory_id');
        soundEngine.playSparkle();
        setLightboxMemory(found);
        setTimeout(() => {
          const el = document.getElementById(`archive-card-${found.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }
    };

    // Check if notification clicked earlier left a pending memory ID
    const pendingId = sessionStorage.getItem('pending_open_memory_id');
    if (pendingId && memories.length > 0) {
      openTargetMemory(pendingId);
    }

    const handleOpenMemoryEvent = (e: CustomEvent<{ memoryId: string }>) => {
      const targetId = e.detail?.memoryId;
      if (targetId) {
        openTargetMemory(targetId);
      }
    };

    window.addEventListener('garden-open-memory' as any, handleOpenMemoryEvent);
    return () => window.removeEventListener('garden-open-memory' as any, handleOpenMemoryEvent);
  }, [memories]);

  const handleCloseLightbox = () => {
    if (soundtrackAudioRef.current) {
      soundtrackAudioRef.current.pause();
    }
    setIsPlayingSoundtrack(false);
    setLightboxMemory(null);
  };

  const handleNavigateLightbox = (mem: MemoryEntry) => {
    if (soundtrackAudioRef.current) {
      soundtrackAudioRef.current.pause();
    }
    setIsPlayingSoundtrack(false);
    soundEngine.playSparkle();
    setLightboxMemory(mem);
  };

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setCaption('');
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
    setMusicUrl(undefined);
    setMusicTitle(undefined);
    setMusicArtist(undefined);
    setShowMusicPicker(false);
    setCustomSpotifyUrl('');
    setCompressionStats(null);
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
      const comp = await compressImageWithStats(file, 1280, 1280, 0.82);
      setPhotoUrl(comp.dataUrl);
      setCompressionStats(comp);
      setVideoUrl(undefined);
      setMediaType('photo');

      // AI Romantic title and caption suggestion if user hasn't typed one or name is machine numbers
      if (!title || isRawMachineName(title) || isRawMachineName(file.name)) {
        setIsGeneratingAi(true);
        try {
          const suggestion = await generateRomanticMetadata(comp.dataUrl, file.name);
          setTitle(suggestion.title);
          if (!caption) setCaption(suggestion.caption);
        } catch {
          setTitle('A Stolen Sweet Moment ♡');
        } finally {
          setIsGeneratingAi(false);
        }
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

      // AI Romantic title and caption suggestion if user hasn't typed one or name is machine numbers
      if (!title || isRawMachineName(title) || isRawMachineName(file.name)) {
        setIsGeneratingAi(true);
        try {
          const suggestion = await generateRomanticMetadata(thumbnailUrl, file.name);
          setTitle(suggestion.title);
          if (!caption) setCaption(suggestion.caption);
        } catch {
          setTitle('A Stolen Sweet Moment ♡');
        } finally {
          setIsGeneratingAi(false);
        }
      }
    } catch (err) {
      console.error('[VideoUpload] Failed to process video:', err);
      setErrorMsg('Failed to process video file. Please try another video format (MP4, MOV, WebM).');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleGenerateAiSuggestion = async () => {
    soundEngine.playSparkle();
    setIsGeneratingAi(true);
    try {
      const suggestion = await generateRomanticMetadata(photoUrl || undefined, title);
      setTitle(suggestion.title);
      setCaption(suggestion.caption);
    } catch {
      setTitle('A Stolen Sweet Moment ♡');
      setCaption('A quiet moment that made time stop just for a little while.');
    } finally {
      setIsGeneratingAi(false);
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
    if (isSaving) return; // Prevent double submit

    if (!photoUrl.trim() && !videoUrl) {
      setErrorMsg('Please select a photo or video from your phone.');
      return;
    }

    // Never save raw machine numbers as title or comment
    let finalTitle = title.trim();
    let finalCaption = caption.trim();
    if (!finalTitle || isRawMachineName(finalTitle)) {
      const suggestion = await generateRomanticMetadata(photoUrl || undefined, finalTitle);
      finalTitle = suggestion.title;
      if (!finalCaption) finalCaption = suggestion.caption;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      const newEntry = await memoryArchiveService.addMemory({
        title: finalTitle,
        caption: finalCaption,
        description: finalCaption,
        photoUrl: photoUrl || '/assets/garden/card_archive.jpg',
        videoUrl: cloudVideoUrl || videoUrl,
        videoMediaId,
        mediaType,
        voiceNoteUrl,
        audioFileName,
        musicUrl,
        musicTitle,
        musicArtist,
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
      await loadMemories();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save memory.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenMusicPicker = async () => {
    soundEngine.playSparkle();
    setShowMusicPicker((prev) => !prev);
    if (availableSongs.length === 0) {
      try {
        const songs = await soundGardenService.getSongs();
        setAvailableSongs(songs);
      } catch (e) {
        console.warn('Could not load songs for picker:', e);
      }
    }
  };

  const handleMusicFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      soundEngine.playSparkle();
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const dataUrl = await mediaStorage.readFileAsDataUrl(file);
      setMusicUrl(dataUrl);
      setMusicTitle(cleanName);
      setMusicArtist(currentUser.displayName);
      setShowMusicPicker(false);
    } catch (err) {
      console.warn('[Archive] Could not read music file:', err);
    }
  };

  const handleAttachSpotify = async () => {
    if (!customSpotifyUrl.trim()) return;
    setIsCheckingSpotify(true);
    soundEngine.playSparkle();
    try {
      const oembed = await fetchSpotifyOEmbed(customSpotifyUrl.trim());
      setMusicUrl(customSpotifyUrl.trim());
      setMusicTitle(oembed?.title || 'Spotify Soundtrack');
      setMusicArtist(oembed?.artist || 'Spotify');
      setCustomSpotifyUrl('');
      setShowMusicPicker(false);
    } catch {
      setMusicUrl(customSpotifyUrl.trim());
      setMusicTitle('Spotify Soundtrack');
      setMusicArtist('Spotify');
      setCustomSpotifyUrl('');
      setShowMusicPicker(false);
    } finally {
      setIsCheckingSpotify(false);
    }
  };

  const handleSelectSoundGardenSong = (song: SongEntry) => {
    soundEngine.playSparkle();
    setMusicUrl(song.audioUrl || song.musicUrl);
    setMusicTitle(song.title);
    setMusicArtist(song.artist);
    setShowMusicPicker(false);
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
      {likeNotificationToast && (
        <div
          onClick={() => {
            if (lastLikedMemoryId) {
              const found = memories.find((m) => m.id === lastLikedMemoryId);
              if (found) {
                soundEngine.playSparkle();
                setLightboxMemory(found);
              }
            }
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-pink-600/95 hover:bg-pink-500 text-white text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/30 z-[10001] animate-bounce-subtle cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
          role="button"
          title="Tap to view liked memory"
        >
          <span>{likeNotificationToast}</span>
          <span className="text-[10px] opacity-80 underline ml-1">Open ↗</span>
        </div>
      )}

      {/* 1. Top Banner Button — Matching Mockup Reference */}
      <div
        onClick={handleOpenAdd}
        className="add-memory-banner group cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleOpenAdd();
        }}
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

      {/* 1.5 "On This Day" Romantic Time Machine */}
      <OnThisDayTimeMachine
        flashbacks={flashbacks}
        onOpenMemory={(mem) => {
          soundEngine.playSparkle();
          setLightboxMemory(mem);
        }}
      />

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
            const displayTitle = formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken);
            const isLiked = Boolean(likedCards[mem.id]);
            const count = likeCounts[mem.id] || getInitialLikes(mem.id);
            const comments = getInitialComments(mem.id);
            const categoryTag = (mem as any).category || (mem.isShared ? 'Moment' : 'Private');

            return (
              <div
                key={mem.id}
                id={`archive-card-${mem.id}`}
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
                    title={isLiked ? 'Liked!' : 'Like this memory'}
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

                  {/* Soundtrack badge */}
                  {(mem.musicTitle || mem.musicUrl) && (
                    <div
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-pink-200 border border-pink-400/40 flex items-center gap-1 max-w-[85%] truncate z-10 shadow-sm"
                      title={mem.musicTitle || 'Soundtrack'}
                    >
                      <Disc3 className="w-2.5 h-2.5 text-pink-300 shrink-0" />
                      <span className="truncate">{mem.musicTitle || 'Soundtrack'}</span>
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
                    title={mem.caption || mem.description || 'A timeless moment in our story.'}
                  >
                    “{mem.caption || mem.description || 'A timeless moment in our story.'}” ♡
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
            const displayTitle = formatMemoryDisplayTitle(mem.title, mem.caption, mem.dateTaken);
            const isLiked = Boolean(likedCards[mem.id]);
            const count = likeCounts[mem.id] || getInitialLikes(mem.id);

            return (
              <div
                key={mem.id}
                id={`archive-card-${mem.id}`}
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

                {/* Complete Unclipped Note */}
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-pink-300/30 my-2">
                  <p className="keepsake-album-text">
                    “{mem.caption || mem.description || 'A timeless moment in our story.'}” ♡
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

                {/* Soundtrack if attached */}
                {(mem.musicTitle || mem.musicUrl) && (
                  <div className="my-2 p-3 rounded-2xl bg-pink-500/10 border border-pink-400/25 flex items-center gap-2.5 text-xs text-pink-200">
                    <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center shrink-0">
                      <Disc3 className="w-4 h-4 text-pink-300" />
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-white truncate block">{mem.musicTitle || 'Soundtrack of this moment'}</span>
                      {mem.musicArtist && (
                        <span className="text-[11px] text-pink-300/70 truncate block">{mem.musicArtist}</span>
                      )}
                    </div>
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
                    <span>{count} {count === 1 ? 'Like' : 'Likes'}</span>
                  </button>

                  <div className="flex items-center gap-2">
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
      {lightboxMemory && (() => {
        const modalContent = (
          <div
            className={
              lightboxMemory.videoUrl
                ? 'fixed inset-0 flex flex-col justify-between select-none animate-fade-in'
                : styles.modalBackdrop
            }
            style={
              lightboxMemory.videoUrl
                ? {
                    zIndex: 99999,
                    backgroundColor: '#05020a',
                    position: 'fixed',
                    inset: 0,
                  }
                : { zIndex: 5000 }
            }
            onClick={handleCloseLightbox}
          >
          {lightboxMemory.videoUrl ? (
            /* Immersive Full-Screen Cinema Video Player */
            <>
              {/* Floating Top Header Bar */}
              <div
                className="relative z-30 flex items-center justify-between p-3 sm:p-5"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="p-2 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-300 shrink-0">
                    <Film className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate drop-shadow-md">
                      {formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}
                    </h3>
                    <p className="text-[11px] font-mono text-pink-200/80 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-400" />
                      <span>{lightboxMemory.dateTaken || 'Special Day'}</span>
                      {filteredMemories.length > 1 && (
                        <>
                          <span className="text-white/40">•</span>
                          <span>{currentLightboxIdx + 1} of {filteredMemories.length}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseLightbox}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500 border border-white/20 text-white active:scale-90 transition-all cursor-pointer shadow-lg backdrop-blur-md"
                    aria-label="Close video view"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Full-Screen Center Video Stage */}
              <div
                className="flex-1 w-full flex items-center justify-center p-1 sm:p-4 overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  key={lightboxMemory.id}
                  src={lightboxMemory.videoUrl}
                  poster={lightboxMemory.photoUrl}
                  controls
                  playsInline
                  autoPlay
                  preload="auto"
                  className="w-full h-full max-h-[82vh] sm:max-h-[86vh] object-contain mx-auto rounded-xl sm:rounded-2xl shadow-2xl cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = e.currentTarget;
                    if (v.paused) v.play().catch(() => {});
                    else v.pause();
                  }}
                />
              </div>

              {/* Floating Bottom Navigation & Romantic Caption */}
              <div
                className="relative z-30 p-3 sm:p-5 space-y-2.5"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 70%, transparent 100%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {lightboxMemory.caption && (
                  <p className="font-handwriting text-xl sm:text-2xl text-center text-pink-100/90 leading-snug drop-shadow-md px-3 line-clamp-2">
                    “{lightboxMemory.caption}” ♡
                  </p>
                )}

                {/* Voice Whisper Section */}
                {isRecordingWhisper ? (
                  <div className="max-w-md mx-auto p-3 rounded-2xl bg-black/60 border border-pink-400/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-pink-200">
                      <span>🎙️ Record Voice Whisper</span>
                      <button
                        type="button"
                        onClick={() => setIsRecordingWhisper(false)}
                        className="text-pink-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <VoiceNoteRecorder
                      onRecorded={async (dataUrl, _duration, fileName) => {
                        soundEngine.playSparkle();
                        if (!lightboxMemory) return;
                        await memoryArchiveService.updateMemoryVoiceWhisper(lightboxMemory.id, dataUrl, fileName);
                        setLightboxMemory({ ...lightboxMemory, voiceNoteUrl: dataUrl, audioFileName: fileName });
                        setMemories((prev) =>
                          prev.map((m) =>
                            m.id === lightboxMemory.id ? { ...m, voiceNoteUrl: dataUrl, audioFileName: fileName } : m
                          )
                        );
                        setIsRecordingWhisper(false);

                        notificationService.sendNotification({
                          type: 'memory',
                          title: '🎙️ Added Voice Whisper',
                          message: `${currentUser.displayName} attached a voice whisper to "${lightboxMemory.title}" ♡`,
                          targetTab: 'archive',
                          senderId: currentUser.id,
                          senderName: currentUser.displayName,
                          recipientId: partner.id,
                          entityId: lightboxMemory.id,
                        });
                      }}
                      onCancel={() => setIsRecordingWhisper(false)}
                    />
                  </div>
                ) : lightboxMemory.voiceNoteUrl ? (
                  <div className="max-w-md mx-auto space-y-1">
                    <GardenAudioPlayer
                      src={lightboxMemory.voiceNoteUrl}
                      title={`Voice Note: ${formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}`}
                      subtitle={`Recorded by ${lightboxMemory.contributorName || 'Garden'}`}
                      isVoiceNote={true}
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setIsRecordingWhisper(true)}
                        className="text-[10px] text-pink-300/80 hover:text-pink-200 underline cursor-pointer"
                      >
                        Re-record whisper 🎙️
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsRecordingWhisper(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-pink-500/25 border border-pink-400/30 text-pink-200 hover:text-white text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <Mic className="w-3.5 h-3.5 text-pink-300" />
                      <span>Add Voice Whisper 🎙️</span>
                    </button>
                  </div>
                )}

                {/* Soundtrack if attached to video */}
                {lightboxMemory.musicUrl && (
                  <div className="max-w-md mx-auto">
                    {isSpotifyUrl(lightboxMemory.musicUrl) ? (
                      <a
                        href={lightboxMemory.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-xs text-white hover:bg-emerald-500/25 transition-all shadow-md"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Music2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-white truncate block">{lightboxMemory.musicTitle || 'Soundtrack'}</span>
                            <span className="text-[10px] text-emerald-200/70 truncate block">{lightboxMemory.musicArtist || 'Spotify'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 shrink-0">
                          Open Spotify ↗
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-pink-500/15 border border-pink-400/30 text-xs text-white shadow-md">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-8 h-8 rounded-full bg-pink-500/30 border border-pink-400/40 flex items-center justify-center shrink-0 ${isPlayingSoundtrack ? 'ring-2 ring-pink-400/60' : ''}`}>
                            <Disc3 className={`w-4 h-4 text-pink-300 ${isPlayingSoundtrack ? 'animate-spin' : ''}`} />
                          </div>
                          <div className="truncate">
                            <span className="font-medium text-white truncate block">{lightboxMemory.musicTitle || 'Soundtrack'}</span>
                            <span className="text-[10px] text-pink-200/70 truncate block">{lightboxMemory.musicArtist || 'Garden Soundtrack'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playSparkle();
                            if (soundtrackAudioRef.current) {
                              if (isPlayingSoundtrack) {
                                soundtrackAudioRef.current.pause();
                                setIsPlayingSoundtrack(false);
                              } else {
                                soundtrackAudioRef.current.play().catch(() => {});
                                setIsPlayingSoundtrack(true);
                              }
                            }
                          }}
                          className="px-3 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          {isPlayingSoundtrack ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-white" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Play Music ♫</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Navigation Row — Permanent Kept Keepsake */}
                {filteredMemories.length > 1 && (
                  <div className="flex items-center justify-center max-w-lg mx-auto pt-1 gap-2 text-xs text-white/90">
                    <button
                      type="button"
                      disabled={currentLightboxIdx <= 0}
                      onClick={() => {
                        if (currentLightboxIdx > 0) {
                          handleNavigateLightbox(filteredMemories[currentLightboxIdx - 1]);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <span className="font-mono text-[11px] text-pink-300">
                      {currentLightboxIdx + 1} of {filteredMemories.length}
                    </span>

                    <button
                      type="button"
                      disabled={currentLightboxIdx >= filteredMemories.length - 1}
                      onClick={() => {
                        if (currentLightboxIdx < filteredMemories.length - 1) {
                          handleNavigateLightbox(filteredMemories[currentLightboxIdx + 1]);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Standard Romantic Photo Card Modal */
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
                  onClick={handleCloseLightbox}
                  className={styles.modalCloseBtn}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className={styles.lightboxImageStage}>
                <img
                  src={lightboxMemory.photoUrl}
                  alt={formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}
                  className={styles.lightboxMainImage}
                />
              </div>

              {lightboxMemory.caption && (
                <p className={styles.lightboxCaption}>
                  “{lightboxMemory.caption}” ♡
                </p>
              )}

              {/* Voice Whisper Section */}
              {isRecordingWhisper ? (
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-pink-400/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-pink-200">
                    <span>🎙️ Record Voice Whisper</span>
                    <button
                      type="button"
                      onClick={() => setIsRecordingWhisper(false)}
                      className="text-pink-300 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <VoiceNoteRecorder
                    onRecorded={async (dataUrl, _duration, fileName) => {
                      soundEngine.playSparkle();
                      if (!lightboxMemory) return;
                      await memoryArchiveService.updateMemoryVoiceWhisper(lightboxMemory.id, dataUrl, fileName);
                      setLightboxMemory({ ...lightboxMemory, voiceNoteUrl: dataUrl, audioFileName: fileName });
                      setMemories((prev) =>
                        prev.map((m) =>
                          m.id === lightboxMemory.id ? { ...m, voiceNoteUrl: dataUrl, audioFileName: fileName } : m
                        )
                      );
                      setIsRecordingWhisper(false);

                      notificationService.sendNotification({
                        type: 'memory',
                        title: '🎙️ Added Voice Whisper',
                        message: `${currentUser.displayName} attached a voice whisper to "${lightboxMemory.title}" ♡`,
                        targetTab: 'archive',
                        senderId: currentUser.id,
                        senderName: currentUser.displayName,
                        recipientId: partner.id,
                        entityId: lightboxMemory.id,
                      });
                    }}
                    onCancel={() => setIsRecordingWhisper(false)}
                  />
                </div>
              ) : lightboxMemory.voiceNoteUrl ? (
                <div className="space-y-1">
                  <GardenAudioPlayer
                    src={lightboxMemory.voiceNoteUrl}
                    title={`Voice Note: ${formatMemoryDisplayTitle(lightboxMemory.title, lightboxMemory.caption, lightboxMemory.dateTaken)}`}
                    subtitle={`Recorded by ${lightboxMemory.contributorName || 'Garden'}`}
                    isVoiceNote={true}
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsRecordingWhisper(true)}
                      className="text-[10px] text-pink-300/80 hover:text-pink-200 underline cursor-pointer"
                    >
                      Re-record whisper 🎙️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setIsRecordingWhisper(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-pink-500/20 border border-pink-400/30 text-pink-200 hover:text-white text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Mic className="w-3.5 h-3.5 text-pink-300" />
                    <span>Add Voice Whisper 🎙️</span>
                  </button>
                </div>
              )}

              {/* Soundtrack Player if attached to photo */}
              {lightboxMemory.musicUrl && (
                <div className="w-full">
                  {isSpotifyUrl(lightboxMemory.musicUrl) ? (
                    <a
                      href={lightboxMemory.musicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-xs text-white hover:bg-emerald-500/25 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Music2 className="w-4 h-4 text-emerald-300 shrink-0" />
                        <div className="truncate">
                          <span className="font-medium text-white truncate block">{lightboxMemory.musicTitle || 'Soundtrack'}</span>
                          <span className="text-[10px] text-emerald-200/70 truncate block">{lightboxMemory.musicArtist || 'Spotify'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 shrink-0">
                        Open Spotify ↗
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-pink-500/15 border border-pink-400/30 text-xs text-white shadow-md">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`w-8 h-8 rounded-full bg-pink-500/30 border border-pink-400/40 flex items-center justify-center shrink-0 ${isPlayingSoundtrack ? 'ring-2 ring-pink-400/60' : ''}`}>
                          <Disc3 className={`w-4 h-4 text-pink-300 ${isPlayingSoundtrack ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="truncate">
                          <span className="font-medium text-white truncate block">{lightboxMemory.musicTitle || 'Soundtrack of this moment'}</span>
                          <span className="text-[10px] text-pink-200/70 truncate block">{lightboxMemory.musicArtist || 'Garden Soundtrack'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playSparkle();
                          if (soundtrackAudioRef.current) {
                            if (isPlayingSoundtrack) {
                              soundtrackAudioRef.current.pause();
                              setIsPlayingSoundtrack(false);
                            } else {
                              soundtrackAudioRef.current.play().catch(() => {});
                              setIsPlayingSoundtrack(true);
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {isPlayingSoundtrack ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-white" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Play Music ♫</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden audio element for local/custom audio soundtrack playback */}
              {lightboxMemory.musicUrl && !isSpotifyUrl(lightboxMemory.musicUrl) && (
                <audio
                  ref={soundtrackAudioRef}
                  src={lightboxMemory.musicUrl}
                  onEnded={() => setIsPlayingSoundtrack(false)}
                  onError={() => setIsPlayingSoundtrack(false)}
                  className="hidden"
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
                        handleNavigateLightbox(filteredMemories[currentLightboxIdx - 1]);
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
                        handleNavigateLightbox(filteredMemories[currentLightboxIdx + 1]);
                      }
                    }}
                    className={styles.lightboxNavBtn}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Footer Row — Clean Close Button (No Delete) */}
              <div className="flex items-center justify-end pt-2 border-t border-white/10 text-xs">
                <button
                  type="button"
                  onClick={handleCloseLightbox}
                  className={styles.cancelBtn}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        );
        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
      })()}

      {/* 4. Add Memory Form Modal */}
      {isAdding && (() => {
        const addModalContent = (
          <div
            className={styles.modalBackdrop}
            style={{ zIndex: 9999 }}
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
                <span>Voice Note</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMusicPicker}
                className={`${styles.uploadChoiceBtn} ${
                  musicUrl || showMusicPicker ? styles.uploadChoiceBtnActive : ''
                }`}
              >
                <Music2 className="w-4 h-4" />
                <span>Soundtrack 🎵</span>
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

            <input
              ref={musicFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleMusicFileUpload}
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

            {/* Music / Soundtrack Picker Panel */}
            {showMusicPicker && (
              <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-pink-400/30 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-pink-200 flex items-center gap-1.5">
                    <Music2 className="w-4 h-4 text-pink-300" />
                    <span>Pair this Memory with Music 🎵</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMusicPicker(false)}
                    className="text-pink-300/70 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => musicFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/30 text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-center font-medium"
                  >
                    <Upload className="w-4 h-4 text-pink-300 shrink-0" />
                    <span className="truncate">Upload Song from Phone ♫</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <input
                      type="url"
                      value={customSpotifyUrl}
                      onChange={(e) => setCustomSpotifyUrl(e.target.value)}
                      placeholder="Paste Spotify track link..."
                      className="flex-1 bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      disabled={isCheckingSpotify || !customSpotifyUrl.trim()}
                      onClick={handleAttachSpotify}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium cursor-pointer shrink-0 transition-all text-xs"
                    >
                      {isCheckingSpotify ? '...' : 'Attach'}
                    </button>
                  </div>
                </div>

                {availableSongs.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="text-[11px] font-mono text-pink-200/70">Or choose from Sound Garden:</div>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {availableSongs.map((song) => (
                        <div
                          key={song.id}
                          onClick={() => handleSelectSoundGardenSong(song)}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-pink-500/20 cursor-pointer border border-transparent hover:border-pink-400/30 transition-all text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="text-white font-medium truncate block">{song.title}</span>
                            <span className="text-[10px] text-pink-200/60 truncate block">{song.artist}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 shrink-0 font-mono">
                            Select ♫
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden max-h-52 border border-white/20 shadow-md">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setCompressionStats(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Smart Mobile Compression Badge */}
                {compressionStats && compressionStats.reductionPercent > 0 && (
                  <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between text-xs text-emerald-200 animate-fade-in shadow-sm">
                    <span className="flex items-center gap-1.5 font-medium truncate pr-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span className="truncate">Instant Upload Optimizer</span>
                    </span>
                    <span className="font-mono text-[11px] text-white shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                      {compressionStats.originalFormatted} → {compressionStats.compressedFormatted} ({compressionStats.reductionPercent}% faster ⚡)
                    </span>
                  </div>
                )}
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

            {/* Soundtrack Preview Pill */}
            {musicUrl && (
              <div className="p-3 rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-between text-xs text-pink-200 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/30 border border-pink-400/40 flex items-center justify-center shrink-0">
                    <Disc3 className="w-4 h-4 text-pink-300 animate-spin" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white truncate">{musicTitle || 'Attached Soundtrack'}</span>
                      {isSpotifyUrl(musicUrl) && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-mono">
                          Spotify
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-pink-300/70 truncate block">{musicArtist || 'Soundtrack of this moment'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setMusicUrl(undefined);
                    setMusicTitle(undefined);
                    setMusicArtist(undefined);
                  }}
                  className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer shrink-0 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <div className="flex items-center justify-between mb-1">
                    <label className={styles.formLabel}>
                      <span>Title / Moment *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAiSuggestion}
                      disabled={isGeneratingAi}
                      className="text-[11px] font-medium text-pink-300 hover:text-pink-200 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      title="Generate romantic title & comment"
                    >
                      <Sparkles className={`w-3 h-3 text-amber-300 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAi ? 'Dreaming...' : '✨ Magic AI Caption'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. A Stolen Sweet Moment ♡"
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
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${styles.submitBtn} ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Pinning into Album... ✨</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Pin into Album ✨</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
        return typeof document !== 'undefined' ? createPortal(addModalContent, document.body) : addModalContent;
      })()}
    </div>
  );
};
