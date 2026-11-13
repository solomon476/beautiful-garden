import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  ExternalLink,
  Trash2,
  X,
  Play,
  Pause,
  Sparkles,
  Upload,
  UploadCloud,
  Mic,
  FileAudio,
  Heart,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  MoreVertical,
  RefreshCw,
  Send,
  Search,
  MessageSquare,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { soundGardenService, authService } from '../../services/gardenService';
import { notificationService } from '../../services/notificationService';
import type { SongEntry, SongStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { mediaStorage } from '../../utils/mediaStorage';
import {
  isSpotifyUrl,
  openSpotifyApp,
  SpotifyIcon,
  getCleanSpotifyUrl,
  fetchSpotifyOEmbed,
} from '../../utils/spotify';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';
import styles from './SoundGardenSection.module.css';

export const SoundGardenSection: React.FC = () => {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter & Sub-Nav state
  type SubTab = 'discover' | 'my_tracks' | 'received' | 'playlists' | 'shared';
  type StudioTab = 'song' | 'voice' | 'both' | 'message';

  const [subTab, setSubTab] = useState<SubTab>('discover');
  const [studioTab, setStudioTab] = useState<StudioTab>('song');
  const [isChangingSong, setIsChangingSong] = useState<boolean>(false);
  const [nowPlayingIndex, setNowPlayingIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const audioStickyRef = useRef<HTMLAudioElement | null>(null);

  // Modal states
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialAddParam = searchParams?.get('add');
  const [isAdding, setIsAdding] = useState<boolean>(Boolean(initialAddParam));
  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null);
  const [likeNotificationToast, setLikeNotificationToast] = useState<string | null>(null);
  const [lastLikedSongId, setLastLikedSongId] = useState<string | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('perfect_time_liked_songs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Form state
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<SongStatus>('want_to_listen');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);
  const [isVoiceNote, setIsVoiceNote] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState<boolean>(false);
  const [spotifyDetected, setSpotifyDetected] = useState<{
    title?: string;
    artist?: string;
    thumbnail?: string;
  } | null>(null);
  const [addMode, setAddMode] = useState<'spotify' | 'record' | 'upload'>(
    initialAddParam === 'voice' ? 'record' : initialAddParam === 'upload' ? 'upload' : 'spotify'
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const partner = authService.getPartner();

  const loadSongs = async () => {
    try {
      setLoading(true);
      const list = await soundGardenService.getSongs();
      setSongs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadSongs();
    });
    return unsubscribe;
  }, []);

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setArtist(currentUser.displayName);
    setMusicUrl('');
    setMessage('');
    setStatus('want_to_listen');
    setAudioUrl(undefined);
    setAudioFileName(undefined);
    setIsVoiceNote(false);
    setErrorMsg(null);
    setSpotifyLoading(false);
    setSpotifyDetected(null);
    setAddMode('spotify');
    setIsAdding(true);

    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      navigator.clipboard.readText().then((clip) => {
        if (clip && isSpotifyUrl(clip)) {
          handleMusicUrlChange(clip);
        }
      }).catch(() => {});
    }
  };

  const handleOpenAddSpotify = () => {
    handleOpenAdd();
    setAddMode('spotify');
  };

  const handleOpenAddVoiceNote = () => {
    soundEngine.playSparkle();
    setTitle(`Voice Note for ${partner.displayName}`);
    setArtist(currentUser.displayName);
    setMusicUrl('');
    setMessage('');
    setStatus('want_to_listen');
    setAudioUrl(undefined);
    setAudioFileName(undefined);
    setIsVoiceNote(true);
    setErrorMsg(null);
    setSpotifyLoading(false);
    setSpotifyDetected(null);
    setAddMode('record');
    setIsAdding(true);
  };

  const handleMusicUrlChange = async (url: string) => {
    setMusicUrl(url);
    if (isSpotifyUrl(url)) {
      setSpotifyLoading(true);
      try {
        const clean = getCleanSpotifyUrl(url);
        setMusicUrl(clean);
        const meta = await fetchSpotifyOEmbed(clean);
        if (meta) {
          setSpotifyDetected({
            title: meta.title,
            artist: meta.artist,
            thumbnail: meta.thumbnailUrl,
          });
          if (meta.title) {
            setTitle(meta.title);
          }
          if (meta.artist) {
            setArtist(meta.artist);
          }
        }
      } catch (err) {
        console.warn('Spotify oEmbed parse notice:', err);
      } finally {
        setSpotifyLoading(false);
      }
    } else {
      setSpotifyDetected(null);
    }
  };

  const handlePasteMusicUrl = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleMusicUrlChange(text.trim());
        }
      }
    } catch (err) {
      console.warn('Clipboard read error', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setAudioUrl(stored.dataUrl);
      setAudioFileName(file.name);
      setIsVoiceNote(false);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process audio file. Please try another file.');
    }
  };

  const handleVoiceNoteRecorded = (dataUrl: string, _durationSec: number, name: string) => {
    soundEngine.playSparkle();
    setAudioUrl(dataUrl);
    setAudioFileName(name);
    setIsVoiceNote(true);
    if (!title) {
      setTitle(`Voice Note for ${partner.displayName}`);
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTitle = title.trim() || spotifyDetected?.title?.trim() || '';
    if (!resolvedTitle) {
      setErrorMsg(
        addMode === 'spotify'
          ? 'Please paste a valid Spotify track link.'
          : 'Please enter a title for the song or voice note.'
      );
      return;
    }

    const resolvedArtist =
      artist.trim() ||
      spotifyDetected?.artist?.trim() ||
      (addMode === 'spotify' ? 'Spotify Track' : currentUser.displayName);

    try {
      await soundGardenService.addSong({
        title: resolvedTitle,
        artist: resolvedArtist,
        musicUrl: musicUrl.trim() || undefined,
        audioUrl,
        audioFileName,
        isVoiceNote: addMode === 'record' || isVoiceNote,
        message,
        status,
        coverUrl: spotifyDetected?.thumbnail || undefined,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setIsAdding(false);
      await loadSongs();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save song recommendation.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: SongStatus) => {
    soundEngine.playSparkle();
    await soundGardenService.updateSongStatus(id, newStatus);
    await loadSongs();
    if (selectedSong && selectedSong.id === id) {
      setSelectedSong({ ...selectedSong, status: newStatus });
    }
  };

  const handleDelete = async (song: SongEntry) => {
    if (window.confirm(`Remove "${song.title}" from Sound Garden?`)) {
      try {
        await soundGardenService.deleteSong(song.id);
        soundEngine.playChime(440, 0.8, 0.08);
        setSelectedSong(null);
        await loadSongs();
      } catch (err: any) {
        console.error('Delete error', err);
        alert(err?.message || 'Could not delete song.');
      }
    }
  };

  const isSongLiked = (song: SongEntry | null): boolean => {
    if (!song) return false;
    if (likedSongIds[song.id] !== undefined) return likedSongIds[song.id];
    return Boolean(
      song.reaction &&
        (song.reaction.includes('Love') ||
          song.reaction.includes('💖') ||
          song.reaction.includes('❤️') ||
          song.reaction.includes('Heartfelt'))
    );
  };

  const handleToggleLike = async (song: SongEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playSparkle();

    const currentlyLiked = isSongLiked(song);
    const willBeLiked = !currentlyLiked;

    const nextReaction = willBeLiked ? 'Love it! 💖' : 'My Vibe ✨';

    // 1. Update likedSongIds state and save to localStorage
    const updatedLiked = { ...likedSongIds, [song.id]: willBeLiked };
    setLikedSongIds(updatedLiked);
    try {
      localStorage.setItem('perfect_time_liked_songs', JSON.stringify(updatedLiked));
    } catch {
      // ignore
    }

    // 2. Update in songs state
    const updatedSongs = songs.map((s) => (s.id === song.id ? { ...s, reaction: nextReaction } : s));
    setSongs(updatedSongs);
    if (selectedSong?.id === song.id) {
      setSelectedSong({ ...selectedSong, reaction: nextReaction });
    }

    // 3. Persist reaction to database / service
    soundGardenService.updateSongReaction(song.id, nextReaction).catch((err) => {
      console.warn('Failed to update song reaction in service:', err);
    });

    // 4. Realtime notification to partner & immediate confirmation toast to self (exact Archive behavior)
    if (willBeLiked) {
      const partnerUser = authService.getPartner();
      const user = authService.getCurrentUser();

      notificationService.sendNotification({
        type: 'song',
        title: '❤️ Loved a Song',
        message: `${user.displayName} loved "${song.title} - ${song.artist}" in Sound Garden! 🎶`,
        targetTab: 'sound',
        senderId: user.id,
        senderName: user.displayName,
        recipientId: partnerUser.id,
        entityId: song.id,
      });

      // Immediate confirmation toast to self (matches Archive)
      setLastLikedSongId(song.id);
      setLikeNotificationToast(`❤️ You loved "${song.title}"! Tap to view 🎶`);
      setTimeout(() => setLikeNotificationToast(null), 4000);
    }
  };


  const handleOpenLikedSongDirectly = (songId: string) => {
    const songIndex = songs.findIndex((s) => s.id === songId);
    if (songIndex !== -1) {
      const foundSong = songs[songIndex];
      setNowPlayingIndex(songIndex);
      setSelectedSong(foundSong);
      setIsPlaying(true);
      soundEngine.playSparkle();

      setTimeout(() => {
        const cardEl = document.getElementById(`song-card-${songId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('ring-2', 'ring-pink-400', 'ring-offset-2');
          setTimeout(() => {
            cardEl.classList.remove('ring-2', 'ring-pink-400', 'ring-offset-2');
          }, 2500);
        }
      }, 150);
    }
  };

  // Listen for direct navigation events from notifications
  useEffect(() => {
    const handleDirectOpen = (e: CustomEvent<{ songId: string }>) => {
      const targetId = e.detail?.songId;
      if (targetId) {
        handleOpenLikedSongDirectly(targetId);
      }
    };

    window.addEventListener('garden-open-song' as any, handleDirectOpen);

    const pendingId = sessionStorage.getItem('pending_open_song_id');
    if (pendingId) {
      sessionStorage.removeItem('pending_open_song_id');
      setTimeout(() => {
        handleOpenLikedSongDirectly(pendingId);
      }, 350);
    }

    return () => {
      window.removeEventListener('garden-open-song' as any, handleDirectOpen);
    };
  }, [songs]);

  const currentNowPlaying = songs[nowPlayingIndex] || songs[0] || null;

  const getResolvedAudioUrl = (song: SongEntry | null) => {
    if (!song) return undefined;
    if (song.audioUrl) return song.audioUrl;
    const t = (song.title || '').toLowerCase();
    if (t.includes('flying')) return '/assets/tom_odell_flying_vocal.mp3';
    if (t.includes('golden') || t.includes('piano')) return '/assets/music.mp3';
    return undefined;
  };

  useEffect(() => {
    const audio = audioStickyRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => handleNextTrack();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [nowPlayingIndex, songs]);

  const handleSeek = (newTime: number) => {
    if (audioStickyRef.current && isFinite(newTime)) {
      audioStickyRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = (index: number) => {
    soundEngine.playSparkle();
    setNowPlayingIndex(index);
    const target = songs[index];
    const resolvedAudio = getResolvedAudioUrl(target);
    if (resolvedAudio) {
      setIsPlaying(true);
      if (audioStickyRef.current) {
        audioStickyRef.current.src = resolvedAudio;
        audioStickyRef.current.play().catch(() => {});
      }
    } else if (isSpotifyUrl(target?.musicUrl)) {
      setIsPlaying(true);
      window.open(target.musicUrl, '_blank', 'noopener,noreferrer');
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTogglePlay = () => {
    if (!currentNowPlaying) return;
    const resolvedAudio = getResolvedAudioUrl(currentNowPlaying);
    if (isPlaying) {
      setIsPlaying(false);
      audioStickyRef.current?.pause();
    } else {
      setIsPlaying(true);
      if (resolvedAudio && audioStickyRef.current) {
        if (!audioStickyRef.current.src || !audioStickyRef.current.src.includes(resolvedAudio)) {
          audioStickyRef.current.src = resolvedAudio;
        }
        audioStickyRef.current.play().catch(() => {});
      } else if (isSpotifyUrl(currentNowPlaying.musicUrl)) {
        window.open(currentNowPlaying.musicUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleNextTrack = () => {
    if (songs.length === 0) return;
    const nextIdx = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : (nowPlayingIndex + 1) % songs.length;
    handlePlayTrack(nextIdx);
  };

  const handlePrevTrack = () => {
    if (songs.length === 0) return;
    const prevIdx = (nowPlayingIndex - 1 + songs.length) % songs.length;
    handlePlayTrack(prevIdx);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioStickyRef.current) {
      audioStickyRef.current.volume = newVol / 100;
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioStickyRef.current) audioStickyRef.current.volume = volume / 100;
    } else {
      setIsMuted(true);
      if (audioStickyRef.current) audioStickyRef.current.volume = 0;
    }
  };

  const handleSendStudio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playSparkle();

    const resolvedTitle =
      title.trim() ||
      spotifyDetected?.title?.trim() ||
      (studioTab === 'voice'
        ? `Voice Note for ${partner.displayName}`
        : currentNowPlaying?.title || 'Our Romantic Track');

    const resolvedArtist =
      artist.trim() ||
      spotifyDetected?.artist?.trim() ||
      (studioTab === 'voice'
        ? currentUser.displayName
        : currentNowPlaying?.artist || 'Spotify Track');

    try {
      await soundGardenService.addSong({
        title: resolvedTitle,
        artist: resolvedArtist,
        musicUrl: musicUrl.trim() || currentNowPlaying?.musicUrl || undefined,
        audioUrl,
        audioFileName,
        isVoiceNote: studioTab === 'voice' || studioTab === 'both' || isVoiceNote,
        message: message.trim() || undefined,
        status: 'want_to_listen',
        coverUrl: spotifyDetected?.thumbnail || currentNowPlaying?.coverUrl || undefined,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setMessage('');
      setTitle('');
      setMusicUrl('');
      setIsVoiceNote(false);
      setAudioUrl(undefined);
      setSpotifyDetected(null);
      setIsChangingSong(false);
      setIsAdding(false);
      await loadSongs();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not send song.');
    }
  };

  const getStatusBadge = (s: SongStatus) => {
    switch (s) {
      case 'listened':
        return {
          label: 'Listened',
          icon: '✔',
          badgeClass: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200',
        };
      case 'want_to_listen':
        return {
          label: 'Want to Listen',
          icon: '⭐',
          badgeClass: 'bg-amber-500/25 border-amber-400/50 text-amber-200',
        };
      case 'recommend_back':
        return {
          label: 'Recommend Back',
          icon: '💖',
          badgeClass: 'bg-fuchsia-500/25 border-fuchsia-400/50 text-fuchsia-200',
        };
      default:
        return {
          label: s,
          icon: '🎵',
          badgeClass: 'bg-white/10 text-slate-300',
        };
    }
  };

  const displayedSongs = songs.filter((s) => {
    if (subTab === 'discover') return true;
    if (subTab === 'my_tracks') return s.addedBy === currentUser.id;
    if (subTab === 'received') return s.addedBy !== currentUser.id;
    if (subTab === 'playlists') return true;
    if (subTab === 'shared') return Boolean(s.reaction);
    return true;
  });

  return (
    <div className={styles.soundGarden}>
      {/* Realtime Like Confirmation Toast (Matches Archive Design & Tap Behavior) */}
      {likeNotificationToast && (
        <div
          onClick={() => {
            if (lastLikedSongId) {
              handleOpenLikedSongDirectly(lastLikedSongId);
            }
          }}
          role="button"
          tabIndex={0}
          className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-md text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg border border-pink-400/40 animate-fade-in flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <span>{likeNotificationToast}</span>
          <span className="text-[10px] opacity-80 underline ml-1">Open ↗</span>
        </div>
      )}

      {/* 1. Panoramic Themed Hero Banner matching target visual */}
      <section className={styles.sgHero}>
        <div className={styles.heroLeftArtwork}>
          <img src="/assets/garden/hero_sound.jpg" alt="Sound Garden Headphones" />
        </div>

        <div className={styles.heroCenterBlock}>
          <h2 className={styles.heroScriptTitle}>
            <span>Sound Garden</span>
            <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♫</span>
          </h2>
          <p className={styles.heroSubtitleText}>
            Listen, share and keep the music close...
          </p>
          <div className={styles.heroSwirl}>
            <span>〰️</span>
            <span>♡</span>
            <span>〰️</span>
          </div>
        </div>

        <div className={styles.heroQuoteCard}>
          <p className={styles.heroQuoteText}>
            “Music makes our moments even more special.”
          </p>
          <span className={styles.heroQuoteHeart}>♡</span>
        </div>
      </section>

      {/* 2. Horizontal Sub-Navigation Bar */}
      <nav className={styles.sgSubNav} aria-label="Sound Garden Views">
        <button
          type="button"
          onClick={() => setSubTab('discover')}
          className={`${styles.sgSubNavPill} ${subTab === 'discover' ? styles.sgSubNavPillActive : ''}`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Discover</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('my_tracks')}
          className={`${styles.sgSubNavPill} ${subTab === 'my_tracks' ? styles.sgSubNavPillActive : ''}`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>My Tracks ({songs.filter((s) => s.addedBy === currentUser.id).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('received')}
          className={`${styles.sgSubNavPill} ${subTab === 'received' ? styles.sgSubNavPillActive : ''}`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Received ({songs.filter((s) => s.addedBy !== currentUser.id).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('playlists')}
          className={`${styles.sgSubNavPill} ${subTab === 'playlists' ? styles.sgSubNavPillActive : ''}`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Playlists</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('shared')}
          className={`${styles.sgSubNavPill} ${subTab === 'shared' ? styles.sgSubNavPillActive : ''}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Shared Vibes</span>
        </button>
      </nav>

      {/* 3. Main Studio Workspace Layout */}
      {loading ? (
        <div className="py-16 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Tuning the Sound Garden frequencies...
        </div>
      ) : subTab === 'discover' ? (
        <div className={styles.sgStudioLayout}>
          {/* Left Column: Spotify Connect, Quick Actions & Quote */}
          <aside className={styles.sgLeftCol}>
            <div className={styles.sgConnectCard}>
              <div className={styles.spotifyBadgeRow}>
                <div className={styles.spotifyIconLg}>
                  <SpotifyIcon className="w-5 h-5" style={{ fill: '#000000' }} />
                </div>
                <div>
                  <h4 className={styles.spotifyCardMetaTitle}>Connect with Spotify</h4>
                  <p className={styles.spotifyCardMetaSub}>Search and share songs directly from Spotify.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  openSpotifyApp(title || artist || '');
                  setIsChangingSong(true);
                }}
                className={styles.connectSpotifyBtn}
              >
                <span>Connect Spotify ↗</span>
              </button>

              <div className={styles.orDivider}>— or —</div>

              <div className={styles.sgActionList}>
                <button
                  type="button"
                  onClick={() => setIsChangingSong(true)}
                  className={styles.sgActionItem}
                >
                  <Search className="w-4 h-4 text-pink-300 shrink-0" />
                  <span>Search Songs</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddVoiceNote}
                  className={styles.sgActionItem}
                >
                  <Mic className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Send Voice Note</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddSpotify}
                  className={styles.sgActionItem}
                >
                  <Send className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Share a Song</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setStudioTab('message');
                  }}
                  className={styles.sgActionItem}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span>Send a Message</span>
                </button>
              </div>
            </div>

            <div className={styles.sgMiniQuoteCard}>
              <img src="/assets/garden/hero_sound.jpg" alt="Headphones mini" />
              <p className={styles.sgMiniQuoteText}>
                Good music... <br />better together ♡
              </p>
            </div>
          </aside>

          {/* Center Column: Studio Creator ("Send a Song or Voice Note") */}
          <main className={styles.sgCenterCol}>
            <div className={styles.studioCard}>
              <div className={styles.studioHeader}>
                <h3 className={styles.studioTitle}>
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Send a Song or Voice Note</span>
                </h3>
                <p className={styles.studioSubtitle}>
                  Share a song, voice message or both with {partner.displayName} ♡
                </p>
              </div>

              {/* 4 Mode Selector Tabs */}
              <div className={styles.studioTabs}>
                <button
                  type="button"
                  onClick={() => { soundEngine.playSparkle(); setStudioTab('song'); }}
                  className={`${styles.studioTabBtn} ${studioTab === 'song' ? styles.studioTabBtnActive : ''}`}
                >
                  <span>Song ♫</span>
                </button>

                <button
                  type="button"
                  onClick={() => { soundEngine.playSparkle(); setStudioTab('voice'); }}
                  className={`${styles.studioTabBtn} ${studioTab === 'voice' ? styles.studioTabBtnActive : ''}`}
                >
                  <span>Voice Note 🎙️</span>
                </button>

                <button
                  type="button"
                  onClick={() => { soundEngine.playSparkle(); setStudioTab('both'); }}
                  className={`${styles.studioTabBtn} ${studioTab === 'both' ? styles.studioTabBtnActive : ''}`}
                >
                  <span>Song + Voice</span>
                </button>

                <button
                  type="button"
                  onClick={() => { soundEngine.playSparkle(); setStudioTab('message'); }}
                  className={`${styles.studioTabBtn} ${studioTab === 'message' ? styles.studioTabBtnActive : ''}`}
                >
                  <span>Message ✉️</span>
                </button>
              </div>

              {/* Studio Upper Grid */}
              <div className={styles.studioUpperGrid}>
                {/* Left: Selected Song Panel */}
                <div className={styles.selectedSongPanel}>
                  <div className={styles.selectedSongContent}>
                    <img
                      src={
                        spotifyDetected?.thumbnail ||
                        currentNowPlaying?.coverUrl ||
                        '/assets/garden/cover_flying.jpg'
                      }
                      alt="Selected song cover"
                      className={styles.selectedSongCover}
                    />
                    <div className={styles.selectedSongMeta}>
                      <h4 className={styles.selectedSongTitle}>
                        {spotifyDetected?.title || title || currentNowPlaying?.title || 'Perfect'}
                      </h4>
                      <p className={styles.selectedSongArtist}>
                        {spotifyDetected?.artist || artist || currentNowPlaying?.artist || 'Ed Sheeran'}
                      </p>
                      <div className={styles.selectedSongBadgeRow}>
                        <span className={styles.spotifyBadgePill}>
                          <SpotifyIcon className="w-3 h-3" style={{ fill: '#1db954' }} />
                          <span>Spotify</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentNowPlaying) {
                          handleTogglePlay();
                        } else if (songs.length > 0) {
                          handlePlayTrack(0);
                        }
                      }}
                      className={styles.selectedSongPlayCircle}
                      title={isPlaying ? "Pause preview" : "Play preview"}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-white text-white" />
                      )}
                    </button>
                  </div>

                  <div className={styles.selectedSongActionRow}>
                    {isChangingSong ? (
                      <div className="space-y-2 pt-2 border-t border-purple-400/20 w-full">
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={musicUrl}
                            onChange={(e) => handleMusicUrlChange(e.target.value)}
                            placeholder="Paste Spotify link..."
                            className="w-full text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handlePasteMusicUrl}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs shrink-0 cursor-pointer"
                          >
                            Paste
                          </button>
                        </div>
                        {spotifyLoading && (
                          <p className="text-[11px] font-mono text-emerald-300 animate-pulse">
                            Fetching Spotify song details...
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsChangingSong(true)}
                        className={styles.changeSongBtn}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Change Song 🔄</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Sweet Message Panel */}
                <div className={styles.sweetMessagePanel}>
                  <label className={styles.sweetMessageLabel}>
                    <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                    <span>Add a sweet message (optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                    placeholder="This song made me think of you ♡..."
                    className={styles.sweetMessageTextarea}
                  />
                  <div className={styles.sweetMessageCounter}>
                    {message.length}/200
                  </div>
                </div>
              </div>

              {/* Attach Voice Note (optional) Box */}
              {(studioTab === 'voice' || studioTab === 'both') ? (
                <div className="space-y-2">
                  <VoiceNoteRecorder
                    onRecorded={handleVoiceNoteRecorded}
                    onReset={() => {
                      setAudioUrl(undefined);
                      setAudioFileName(undefined);
                      setIsVoiceNote(false);
                    }}
                  />
                </div>
              ) : (
                <div className={styles.attachVoiceSection}>
                  <label className={styles.attachVoiceSectionLabel}>
                    <Mic className="w-3.5 h-3.5 text-pink-400" />
                    <span>Attach a Voice Note (optional)</span>
                  </label>
                  <div
                    className={styles.attachVoicePanel}
                    onClick={() => {
                      soundEngine.playSparkle();
                      setStudioTab('both');
                    }}
                  >
                    <div className={styles.attachVoiceLeft}>
                      <div className={styles.attachVoiceCloudIcon}>
                        <UploadCloud className="w-5 h-5 text-purple-300" />
                      </div>
                      <div>
                        <h4 className={styles.attachVoiceTitle}>
                          {audioFileName || 'Click to record or upload your voice note'}
                        </h4>
                        <p className={styles.attachVoiceHint}>
                          MP3, M4A, or WAV · Max 10MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playSparkle();
                        setStudioTab('both');
                      }}
                      className={styles.attachVoiceActionBtn}
                      title="Record voice note"
                    >
                      <Mic className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Master CTA Button */}
              <button
                type="button"
                onClick={handleSendStudio}
                className={styles.sendMasterCtaBtn}
              >
                <Send className="w-4 h-4" />
                <span>Send to {partner.displayName} ♡</span>
              </button>
            </div>
          </main>

          {/* Right Column: Your Sound Garden Track Shelf */}
          <aside className={styles.sgRightCol}>
            <div className={styles.shelfCard}>
              <div className={styles.shelfHeader}>
                <div className={styles.shelfTitleBlock}>
                  <h3 className={styles.shelfTitle}>
                    <span className="text-pink-400">🌸</span>
                    <span>Your Sound Garden</span>
                    <span className="text-pink-300 font-sans">♡</span>
                  </h3>
                  <p className={styles.shelfSubtitle}>Your favourite music and messages...</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSubTab('my_tracks')}
                  className={styles.viewAllPillBtn}
                >
                  <span>View All →</span>
                </button>
              </div>

              <div className={styles.shelfTrackList}>
                {songs.slice(0, 6).map((song, idx) => {
                  const coverImage =
                    song.coverUrl ||
                    (song.title.toLowerCase().includes('flying')
                      ? '/assets/garden/cover_flying.jpg'
                      : song.title.toLowerCase().includes('golden')
                      ? '/assets/garden/cover_golden_hour.jpg'
                      : '/assets/garden/card_sound.jpg');

                  const isPlayingThis = isPlaying && nowPlayingIndex === idx;

                  return (
                    <div key={song.id} className={styles.shelfTrackItem}>
                      <div className={styles.shelfTrackCover}>
                        <img src={coverImage} alt={song.title} />
                      </div>

                      <div className={styles.shelfTrackMeta}>
                        <h4
                          onClick={() => setSelectedSong(song)}
                          className={styles.shelfTrackTitle}
                        >
                          {song.title}
                        </h4>
                        <p className={styles.shelfTrackArtist}>{song.artist}</p>
                        <span className={styles.shelfTrackBadge}>
                          {song.isVoiceNote ? 'Voice' : 'Song'} •{' '}
                          {new Date(song.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className={styles.shelfTrackActions}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleLike(song, e)}
                          className={styles.shelfPlayBtn}
                          title={isSongLiked(song) ? 'Loved ♡ Tap to unlike' : 'Love this track'}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-transform active:scale-125 ${isSongLiked(song) ? 'fill-pink-400 text-pink-400' : 'text-pink-300'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePlayTrack(idx)}
                          className={styles.shelfPlayBtn}
                          title={isPlayingThis ? 'Pause' : 'Play'}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-3.5 h-3.5 fill-white text-white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-white text-white" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(song);
                          }}
                          className={styles.shelfDeleteBtn}
                          title="Delete track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSong(song)}
                          className={styles.shelfMenuBtn}
                          title="Track details"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Grid View for other sub-tabs */
        <div className={styles.cardsGrid}>
          {displayedSongs.map((song, idx) => {
            const isAddedByMe = song.addedBy === currentUser.id;
            const badge = getStatusBadge(song.status);
            const coverImage =
              song.coverUrl ||
              (song.title.toLowerCase().includes('flying')
                ? '/assets/garden/cover_flying.jpg'
                : song.title.toLowerCase().includes('golden')
                ? '/assets/garden/cover_golden_hour.jpg'
                : '/assets/garden/card_sound.jpg');

            return (
              <div key={song.id} id={`song-card-${song.id}`} className={styles.sgTrackCard}>
                <div className={styles.cardTop}>
                  <div
                    onClick={() => handlePlayTrack(idx)}
                    className={styles.cardCover}
                    title={`Click to play ${song.title}`}
                  >
                    <img
                      src={coverImage}
                      alt={song.title}
                      className={styles.cardCoverImg}
                    />
                    <div className={styles.cardCoverOverlay} />
                    <div className={styles.cardPlayBtn}>
                      <div className={styles.cardPlayCircle}>
                        {song.isVoiceNote ? (
                          <Mic className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5 text-white fill-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardInfo}>
                    <div className={styles.cardTitleRow}>
                      <h3
                        onClick={() => setSelectedSong(song)}
                        className={styles.cardTitle}
                      >
                        {song.title}
                      </h3>

                      <span className={`${styles.cardBadge} ${badge.badgeClass}`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <p className={styles.cardArtist}>{song.artist}</p>

                    {song.isVoiceNote && (
                      <span className={styles.cardVoiceTag}>
                        <Mic className="w-3 h-3 text-pink-300" />
                        <span>Voice Note</span>
                      </span>
                    )}

                    {song.message && (
                      <p className={styles.cardMessage}>
                        “{song.message}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    )}
                  </div>
                </div>

                {song.audioUrl ? (
                  <div className="pt-1">
                    <GardenAudioPlayer
                      src={song.audioUrl}
                      title={song.title}
                      subtitle={song.artist}
                      isVoiceNote={song.isVoiceNote}
                    />
                  </div>
                ) : null}

                <div className={styles.cardFooter}>
                  <div className={styles.cardAuthor}>
                    <span className={styles.authorAvatar}>👤</span>
                    <span className={styles.authorName}>
                      By: {isAddedByMe ? 'You' : song.addedByName || partner.displayName}
                    </span>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(song, e)}
                      className={`${styles.reactionBtn} ${isSongLiked(song) ? styles.reactionBtnActive : ''}`}
                      title={isSongLiked(song) ? 'Loved ♡ Tap to unlike' : 'Love this track'}
                    >
                      <Heart className={`w-3 h-3 transition-transform active:scale-125 ${isSongLiked(song) ? 'fill-pink-400 text-pink-400' : 'text-pink-300'}`} />
                      <span>{song.reaction || (isSongLiked(song) ? 'Love it! 💖' : 'Love')}</span>
                    </button>

                    {isSpotifyUrl(song.musicUrl) && (
                      <a
                        href={song.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.spotifyPillBtn}
                        title="Open in Spotify App"
                      >
                        <SpotifyIcon className="w-3.5 h-3.5" style={{ fill: '#1db954' }} />
                        <span>Spotify ↗</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSong(song)}
                      className={styles.detailsBtn}
                    >
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(song)}
                      className={styles.cardDeleteBtn}
                      title="Delete track from Sound Garden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Balanced Floating Player Bar (only visible when modals are closed) */}
      {!isAdding && !selectedSong && currentNowPlaying && (
        <div className={styles.stickyPlayerBar}>
          <audio ref={audioStickyRef} />

          {/* Top glowing progress line */}
          <div className={styles.barProgressTrack}>
            <div
              className={styles.barProgressBar}
              style={{
                width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
              }}
            />
          </div>

          {/* Left: Track Meta (Tapping opens maximized view) */}
          <div
            className={styles.playerTrackSide}
            onClick={() => setIsMaximized(true)}
            role="button"
            tabIndex={0}
            title="Tap to maximize player"
          >
            <div className={styles.playerThumbWrapper}>
              <img
                src={
                  currentNowPlaying.coverUrl ||
                  (currentNowPlaying.title.toLowerCase().includes('flying')
                    ? '/assets/garden/cover_flying.jpg'
                    : currentNowPlaying.title.toLowerCase().includes('golden')
                    ? '/assets/garden/cover_golden_hour.jpg'
                    : '/assets/garden/card_sound.jpg')
                }
                alt={currentNowPlaying.title}
                className={`${styles.playerTrackThumb} ${isPlaying ? styles.spinRecordMini : ''}`}
              />
              {isPlaying && <span className={styles.playingDotPulse} />}
            </div>
            <div className={styles.playerTrackMeta}>
              <h4 className={styles.playerTrackTitle}>{currentNowPlaying.title}</h4>
              <p className={styles.playerTrackArtist}>{currentNowPlaying.artist}</p>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className={styles.playerControlsCenter}>
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`${styles.playerControlIconBtn} ${styles.desktopOnlyControl} ${isShuffle ? 'text-pink-300' : ''}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePrevTrack}
              className={styles.playerControlIconBtn}
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={styles.playerMasterPlayBtn}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNextTrack}
              className={styles.playerControlIconBtn}
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`${styles.playerControlIconBtn} ${styles.desktopOnlyControl} ${isRepeat ? 'text-pink-300' : ''}`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Actions & Maximize */}
          <div className={styles.playerRightControls}>
            <button
              type="button"
              onClick={(e) => currentNowPlaying && handleToggleLike(currentNowPlaying, e)}
              className={styles.playerHeartBtn}
              title={isSongLiked(currentNowPlaying) ? 'Loved ♡ Tap to unlike' : 'Love this track'}
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isSongLiked(currentNowPlaying) ? 'fill-pink-400 text-pink-400' : 'text-white/70'}`} />
            </button>

            <div className={`${styles.volumeBarContainer} ${styles.desktopOnlyControl}`}>
              <button
                type="button"
                onClick={handleToggleMute}
                className={styles.playerControlIconBtn}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className={styles.volumeRangeInput}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsMaximized(true)}
              className={styles.playerMaximizeBtn}
              title="Maximize Music Sanctuary Player"
              aria-label="Maximize player"
            >
              <Maximize2 className="w-4 h-4 text-pink-200" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Maximized Music Sanctuary Player (Full Sheet / Dialog) */}
      {isMaximized && currentNowPlaying && (
        <div className={styles.maximizedOverlay} onClick={() => setIsMaximized(false)}>
          <div className={styles.maximizedModal} onClick={(e) => e.stopPropagation()}>
            {/* Top Bar */}
            <div className={styles.maximizedHeader}>
              <button
                type="button"
                onClick={() => setIsMaximized(false)}
                className={styles.maximizedMinimizeBtn}
                title="Minimize player"
                aria-label="Minimize player"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className={styles.maximizedHeaderTitle}>
                <span className={styles.maximizedHeaderTag}>Now Playing in Sanctuary</span>
                <span className={styles.maximizedHeaderSub}>Sound Garden ♡</span>
              </div>
              <button
                type="button"
                onClick={(e) => currentNowPlaying && handleToggleLike(currentNowPlaying, e)}
                className={styles.maximizedHeartBtn}
                title={isSongLiked(currentNowPlaying) ? 'Loved ♡ Tap to unlike' : 'Love this track'}
              >
                <Heart className={`w-5 h-5 transition-transform active:scale-125 ${isSongLiked(currentNowPlaying) ? 'fill-pink-400 text-pink-400' : 'text-white/70'}`} />
              </button>
            </div>

            {/* Giant Album Art / Vinyl Disc */}
            <div className={styles.maximizedVinylSection}>
              <div className={`${styles.maximizedVinylDisc} ${isPlaying ? styles.spinRecord : ''}`}>
                <img
                  src={
                    currentNowPlaying.coverUrl ||
                    (currentNowPlaying.title.toLowerCase().includes('flying')
                      ? '/assets/garden/cover_flying.jpg'
                      : currentNowPlaying.title.toLowerCase().includes('golden')
                      ? '/assets/garden/cover_golden_hour.jpg'
                      : '/assets/garden/card_sound.jpg')
                  }
                  alt={currentNowPlaying.title}
                  className={styles.maximizedCoverImg}
                />
                <div className={styles.vinylCenterPin} />
              </div>
            </div>

            {/* Song Meta & Dedicated Whisper */}
            <div className={styles.maximizedMetaSection}>
              <h2 className={styles.maximizedSongTitle}>{currentNowPlaying.title}</h2>
              <p className={styles.maximizedSongArtist}>{currentNowPlaying.artist}</p>
              <div className={styles.maximizedSenderBadge}>
                <span>Shared with love by {currentNowPlaying.addedByName || 'Solomon 🌿'}</span>
              </div>

              {currentNowPlaying.message && (
                <div className={styles.maximizedWhisperBubble}>
                  <span className={styles.maximizedWhisperLabel}>Whisper Note ♡</span>
                  <p className={styles.maximizedWhisperText}>“{currentNowPlaying.message}”</p>
                </div>
              )}
            </div>

            {/* Scrubber Progress Slider */}
            <div className={styles.maximizedScrubber}>
              <input
                type="range"
                min="0"
                max={isFinite(duration) && duration > 0 ? duration : 100}
                step="0.5"
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className={styles.maximizedRangeInput}
              />
              <div className={styles.maximizedTimeRow}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className={styles.maximizedControls}>
              <button
                type="button"
                onClick={() => setIsShuffle(!isShuffle)}
                className={`${styles.maximizedControlBtn} ${isShuffle ? 'text-pink-300' : ''}`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handlePrevTrack}
                className={styles.maximizedControlBtn}
                title="Previous"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className={styles.maximizedPlayBtn}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-white text-white" />
                ) : (
                  <Play className="w-7 h-7 ml-1 fill-white text-white" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNextTrack}
                className={styles.maximizedControlBtn}
                title="Next"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`${styles.maximizedControlBtn} ${isRepeat ? 'text-pink-300' : ''}`}
                title="Repeat"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Volume & Quick Links */}
            <div className={styles.maximizedBottomRow}>
              <div className={styles.maximizedVolumeGroup}>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={styles.maximizedVolumeIconBtn}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-pink-300" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className={styles.maximizedVolumeSlider}
                />
              </div>

              {currentNowPlaying.musicUrl && isSpotifyUrl(currentNowPlaying.musicUrl) && (
                <a
                  href={currentNowPlaying.musicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.maximizedSpotifyBtn}
                >
                  <SpotifyIcon className="w-4 h-4" style={{ fill: '#000000' }} />
                  <span>Open Spotify ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Details Modal */}
      {selectedSong && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedSong(null)}
        >
          <div
            className={`${styles.modalCard} ${styles.modalCardDetails}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-300/80 uppercase tracking-wider">
                <Music className="w-4 h-4 text-pink-300" />
                <span>Track Details</span>
              </div>
              <button
                onClick={() => setSelectedSong(null)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/20 shadow-md shrink-0">
                <img
                  src={
                    selectedSong.coverUrl ||
                    (selectedSong.title.toLowerCase().includes('flying')
                      ? '/assets/garden/cover_flying.jpg'
                      : selectedSong.title.toLowerCase().includes('golden')
                      ? '/assets/garden/cover_golden_hour.jpg'
                      : '/assets/garden/card_sound.jpg')
                  }
                  alt={selectedSong.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white truncate">{selectedSong.title}</h3>
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(selectedSong, e)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-pink-300 transition-all active:scale-95 cursor-pointer shrink-0"
                    title={isSongLiked(selectedSong) ? 'Loved ♡ Tap to unlike' : 'Love this track'}
                  >
                    <Heart className={`w-5 h-5 transition-transform active:scale-125 ${isSongLiked(selectedSong) ? 'fill-pink-400 text-pink-400' : 'text-pink-300/70'}`} />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-purple-200/90 font-medium">{selectedSong.artist}</p>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                    getStatusBadge(selectedSong.status).badgeClass
                  }`}
                >
                  <span>{getStatusBadge(selectedSong.status).icon}</span>
                  <span>{getStatusBadge(selectedSong.status).label}</span>
                </span>
              </div>
            </div>

            {selectedSong.audioUrl ? (
              <div className="pt-2">
                <GardenAudioPlayer
                  src={selectedSong.audioUrl}
                  title={selectedSong.title}
                  subtitle={selectedSong.artist}
                  isVoiceNote={selectedSong.isVoiceNote}
                />
              </div>
            ) : selectedSong.isVoiceNote ? (
              <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-400/30 flex items-center gap-2 text-xs text-pink-200">
                <Mic className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Personal voice memo</span>
              </div>
            ) : null}

            {selectedSong.message && (
              <div className="quote-whisper-bubble space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-pink-300/80">
                  Memory / Whisper Note
                </div>
                <p className="font-serif italic text-sm text-pink-100/95 leading-relaxed">
                  “{selectedSong.message}” ♡
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <label className="text-xs font-mono uppercase tracking-wider text-purple-300/80 block">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['want_to_listen', 'listened', 'recommend_back'] as SongStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedSong.id, st)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selectedSong.status === st
                        ? 'bg-pink-500/30 border-pink-400/60 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] border-white/10 text-purple-200/70 hover:text-white'
                    }`}
                  >
                    {st === 'want_to_listen' && '🎧 Want'}
                    {st === 'listened' && '✨ Listened'}
                    {st === 'recommend_back' && '💖 Rec'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-purple-400/20 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDelete(selectedSong)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Track</span>
              </button>

              {selectedSong.musicUrl ? (
                isSpotifyUrl(selectedSong.musicUrl) ? (
                  <a
                    href={selectedSong.musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnSpotify}
                    title="Play on Spotify"
                  >
                    <SpotifyIcon className="w-3.5 h-3.5" style={{ fill: '#000000' }} />
                    <span>Play on Spotify ↗</span>
                  </a>
                ) : (
                  <a
                    href={selectedSong.musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glow-romantic text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Link</span>
                  </a>
                )
              ) : (
                <button
                  onClick={() => setSelectedSong(null)}
                  className="btn-glow-romantic text-xs py-2 px-4"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Song or Voice Note Modal Form */}
      {isAdding && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsAdding(false)}
        >
          <div
            className={`${styles.modalCard} ${styles.modalCardAdd}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300">
                  <Music className="w-4 h-4 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add Soundtrack or Voice Note
                  </h4>
                  <p className="text-[11px] text-purple-200/70 font-mono uppercase tracking-wider">
                    Upload audio, record your voice, or link a song
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className={styles.modalCloseBtn}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Input Methods: Spotify Track, Record Voice Note, Upload Audio File */}
            <div className={styles.sgSharingOptions}>
              <button
                type="button"
                onClick={() => setAddMode('spotify')}
                aria-pressed={addMode === 'spotify'}
                className={styles.sgOption}
              >
                <SpotifyIcon className="w-4 h-4 shrink-0" style={{ fill: '#1db954' }} />
                <span>Spotify</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddMode('record');
                  if (!title) setTitle(`Voice Note for ${partner.displayName}`);
                }}
                aria-pressed={addMode === 'record'}
                className={styles.sgOption}
              >
                <Mic className="w-4 h-4 text-pink-300 shrink-0" />
                <span>Voice Note</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddMode('upload');
                  fileInputRef.current?.click();
                }}
                aria-pressed={addMode === 'upload'}
                className={styles.sgOption}
              >
                <Upload className="w-4 h-4 text-purple-300 shrink-0" />
                <span>Upload</span>
              </button>
            </div>

            {/* ============================================================== */}
            {/* Mode 1: Spotify Direct Panel & Form                           */}
            {/* ============================================================== */}
            {addMode === 'spotify' && (
              <form onSubmit={handleSaveSong} className="space-y-4 animate-fade-in">
                <div className={styles.spotifyPanel}>
                  {/* Spotify Header Row */}
                  <div className={styles.spotifyPanelHeader}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                        <SpotifyIcon className="w-5 h-5" style={{ fill: '#1db954' }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-serif text-xs sm:text-base font-semibold text-emerald-100">
                          Choose from Spotify 🎧
                        </h5>
                        <p className="text-[10px] sm:text-[11px] text-emerald-300/80 font-mono">
                          Title, artist & artwork auto-sync
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSpotifyApp(title || artist || '')}
                      className={styles.spotifyPillBtn}
                      title="Open Spotify to search & copy track"
                    >
                      <span>Open Spotify ↗</span>
                    </button>
                  </div>

                  {/* Paste / URL Input Row */}
                  <div className="space-y-1.5">
                    <div className={styles.spotifyInputRow}>
                      <input
                        type="url"
                        value={musicUrl}
                        onChange={(e) => handleMusicUrlChange(e.target.value)}
                        placeholder="Paste link: https://open.spotify.com/track/..."
                        className={styles.spotifyInput}
                      />
                      <button
                        type="button"
                        onClick={handlePasteMusicUrl}
                        className={styles.spotifyPasteBtn}
                      >
                        Paste
                      </button>
                    </div>
                    <p className={styles.spotifyHint}>
                      💡 In Spotify, tap Share (•••) → "Copy Link", then tap Paste here!
                    </p>
                  </div>

                  {/* Loading Indicator */}
                  {spotifyLoading && (
                    <p className="text-xs font-mono text-emerald-300 animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Connecting to Spotify & fetching song details...
                    </p>
                  )}

                  {/* Detected Track Preview Card */}
                  {spotifyDetected && (
                    <div className="space-y-3 pt-1 animate-fade-in">
                      <div className={styles.spotifyDetectedCard}>
                        {spotifyDetected.thumbnail ? (
                          <img
                            src={spotifyDetected.thumbnail}
                            alt="Album Cover"
                            className={styles.spotifyDetectedImg}
                          />
                        ) : (
                          <div className={styles.spotifyDetectedPlaceholder}>
                            <SpotifyIcon className="w-7 h-7" style={{ fill: '#1db954' }} />
                          </div>
                        )}
                        <div className={styles.spotifyDetectedDetails}>
                          <div className={styles.spotifyDetectedTitle}>
                            {spotifyDetected.title || 'Spotify Track'}
                          </div>
                          <div className={styles.spotifyDetectedArtist}>
                            {artist && artist !== currentUser.displayName
                              ? `by ${artist}`
                              : 'Album cover synced automatically'}
                          </div>
                        </div>
                        <span className={styles.spotifyLinkedBadge}>
                          Linked ✓
                        </span>
                      </div>

                      {/* Compact Title & Artist row for customization */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block mb-1">
                            Song Title
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Song Title"
                            className="w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block mb-1">
                            Artist (Optional)
                          </label>
                          <input
                            type="text"
                            value={artist === currentUser.displayName ? '' : artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="e.g. Artist or band name"
                            className="w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Love Note / Memory */}
                <div>
                  <label className="form-field-label">
                    <span>Why You Love It / Dedicated Memory (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. The song that reminds me of our long talks..."
                  />
                </div>

                {/* Initial Status */}
                <div>
                  <label className="form-field-label">
                    <span>Initial Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SongStatus)}
                    className="garden-select w-full"
                  >
                    <option value="want_to_listen">Want to listen 🎧</option>
                    <option value="listened">Listened ✨</option>
                    <option value="recommend_back">Recommend back 💖</option>
                  </select>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    {errorMsg}
                  </p>
                )}

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-400/20">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim() && !spotifyDetected?.title}
                    className={`${styles.btnSpotify} disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ padding: '0.625rem 1.5rem' }}
                  >
                    <Sparkles className="w-4 h-4 fill-black text-black" />
                    <span>
                      {spotifyDetected?.title
                        ? `Add "${spotifyDetected.title}" to Sound Garden 🎵`
                        : 'Upload to Sound Garden 🎵'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* Mode 2: Voice Note Panel & Form                                */}
            {/* ============================================================== */}
            {addMode === 'record' && (
              <form onSubmit={handleSaveSong} className="space-y-4 animate-fade-in">
                <VoiceNoteRecorder
                  onRecorded={handleVoiceNoteRecorded}
                  onReset={() => {
                    setAudioUrl(undefined);
                    setAudioFileName(undefined);
                    setIsVoiceNote(false);
                  }}
                  onCancel={() => setAddMode('spotify')}
                />

                <div>
                  <label className="form-field-label">
                    <span>Voice Note Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`e.g. Good morning message for ${partner.displayName}`}
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>A Sweet Whisper / Note (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Listen whenever you miss my voice..."
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Initial Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SongStatus)}
                    className="garden-select w-full"
                  >
                    <option value="want_to_listen">Want to listen 🎧</option>
                    <option value="listened">Listened ✨</option>
                    <option value="recommend_back">Recommend back 💖</option>
                  </select>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-400/20">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!audioUrl}
                    className="btn-glow-romantic disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{audioUrl ? 'Save Voice Note 💖' : 'Record audio first 🎙️'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* Mode 3: Upload Audio File Panel & Form                         */}
            {/* ============================================================== */}
            {addMode === 'upload' && (
              <form onSubmit={handleSaveSong} className="space-y-4 animate-fade-in">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {!audioUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-purple-400/40 bg-purple-500/10 hover:bg-purple-500/15 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-purple-100">
                      Click to choose an audio file (.mp3, .m4a, .wav)
                    </p>
                    <p className="text-xs text-purple-300/70">
                      Upload audio directly from your phone or computer
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-400/40 space-y-2">
                    <div className="flex items-center justify-between text-xs text-purple-200">
                      <span className="flex items-center gap-1.5 font-mono">
                        <FileAudio className="w-4 h-4 text-purple-300" />
                        <span>{audioFileName || 'Uploaded Track'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-purple-300 hover:text-white underline cursor-pointer"
                      >
                        Change file
                      </button>
                    </div>
                    <GardenAudioPlayer
                      src={audioUrl}
                      title={title || audioFileName || 'Audio Track'}
                      subtitle="Audio Preview"
                      isVoiceNote={false}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="form-field-label">
                      <span>Song Title *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Flying or Our Favorite Song"
                    />
                  </div>

                  <div>
                    <label className="form-field-label">
                      <span>Artist / Creator</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder={`e.g. Artist name or ${currentUser.displayName}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Why You Love It / Memory Behind It</span>
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. The melody that always calms my mind..."
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Initial Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SongStatus)}
                    className="garden-select w-full"
                  >
                    <option value="want_to_listen">Want to listen 🎧</option>
                    <option value="listened">Listened ✨</option>
                    <option value="recommend_back">Recommend back 💖</option>
                  </select>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-400/20">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-glow-romantic">
                    <Upload className="w-4 h-4" />
                    <span>Upload Song to Garden 🎵</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
