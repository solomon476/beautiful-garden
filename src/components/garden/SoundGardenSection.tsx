import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Play,
  Sparkles,
  Upload,
  Mic,
  FileAudio,
} from 'lucide-react';
import { soundGardenService, authService } from '../../services/gardenService';
import type { SongEntry, SongStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { mediaStorage } from '../../utils/mediaStorage';
import {
  isSpotifyUrl,
  openSpotifySearch,
  SpotifyIcon,
  getCleanSpotifyUrl,
  fetchSpotifyOEmbed,
} from '../../utils/spotify';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';

export const SoundGardenSection: React.FC = () => {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter] = useState<'all' | SongStatus>('all');

  // Modal states
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<SongStatus>('want_to_listen');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioFileName, setAudioFileName] = useState<string | undefined>(undefined);
  const [isVoiceNote, setIsVoiceNote] = useState<boolean>(false);
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState<boolean>(false);
  const [spotifyDetected, setSpotifyDetected] = useState<{
    title?: string;
    artist?: string;
    thumbnail?: string;
  } | null>(null);

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
    setShowRecorder(false);
    setErrorMsg(null);
    setSpotifyLoading(false);
    setSpotifyDetected(null);
    setIsAdding(true);
  };

  const handleMusicUrlChange = async (url: string) => {
    setMusicUrl(url);
    if (isSpotifyUrl(url)) {
      setSpotifyLoading(true);
      try {
        const clean = getCleanSpotifyUrl(url);
        const meta = await fetchSpotifyOEmbed(clean);
        if (meta) {
          setSpotifyDetected({
            title: meta.title,
            artist: meta.artist,
            thumbnail: meta.thumbnailUrl,
          });
          if (meta.title && !title) {
            setTitle(meta.title);
          }
          if (meta.artist && (!artist || artist === currentUser.displayName)) {
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
          handleMusicUrlChange(text);
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
      setShowRecorder(false);
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
    setShowRecorder(false);
    if (!title) {
      setTitle(`Voice Note for ${partner.displayName}`);
    }
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a title for the song or voice note.');
      return;
    }

    try {
      await soundGardenService.addSong({
        title,
        artist: artist.trim() || currentUser.displayName,
        musicUrl: musicUrl.trim() || undefined,
        audioUrl,
        audioFileName,
        isVoiceNote,
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
    if (song.addedBy !== currentUser.id) return;
    if (window.confirm(`Remove "${song.title}" from recommendations?`)) {
      await soundGardenService.deleteSong(song.id);
      setSelectedSong(null);
      await loadSongs();
    }
  };

  const handleToggleReaction = async (song: SongEntry) => {
    soundEngine.playSparkle();
    const reactions = ['Love it! 💖', 'My Vibe ✨', 'Always in my head 🎶', 'Heartfelt 🌷'];
    const currentIdx = reactions.findIndex((r) => r.includes(song.reaction?.replace(/[^\w\s]/gi, '').trim() || ''));
    const nextReaction = reactions[(currentIdx + 1) % reactions.length];

    const updated = songs.map((s) => (s.id === song.id ? { ...s, reaction: nextReaction } : s));
    setSongs(updated);
    if (selectedSong?.id === song.id) {
      setSelectedSong({ ...selectedSong, reaction: nextReaction });
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

  const filteredSongs = songs.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.status === activeFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner */}
      <section
        className="relative rounded-3xl overflow-hidden border border-purple-400/30 shadow-2xl p-5 sm:p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(29, 14, 53, 0.94) 0%, rgba(15, 7, 30, 0.98) 100%)',
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/hero_sound.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(168, 85, 247, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 w-full">
          {/* Left Decorative Artwork & Details */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-purple-300/40 shadow-xl shrink-0 group">
              <img
                src="/assets/garden/hero_sound.jpg"
                alt="Sound Garden Headphones"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ The Sound Garden</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Sound Garden</span>
                <span className="text-pink-400 font-sans text-xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-xs sm:text-base text-purple-200/90 max-w-xl leading-relaxed">
                Songs, voice notes, and quiet tracks that bring us back to each other.
              </p>

              <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-purple-300/70 pt-0.5">
                Upload • Record • Listen • Feel
              </div>

              {/* Direct Left Column Add Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add Music / Voice Note 🎵</span>
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
              <Music className="w-4 h-4 text-white" />
              <span>Share Song or Voice Note 🎙️</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Songs Grid — Responsive Cards */}
      {loading ? (
        <div className="py-16 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Tuning the Sound Garden frequencies...
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="glass-midnight-card p-8 sm:p-10 rounded-3xl text-center space-y-4 border border-purple-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl sm:text-2xl text-white">No tracks in this view yet</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            {activeFilter === 'all'
              ? 'Share a song or record a heartfelt voice note to start our shared soundtrack.'
              : `No tracks currently marked as "${activeFilter.replace(/_/g, ' ')}".`}
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Song or Voice Note 🎵</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredSongs.map((song) => {
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
              <div
                key={song.id}
                className="group relative rounded-3xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:border-pink-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 20, 68, 0.65) 0%, rgba(20, 10, 40, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork & Song Info */}
                <div className="flex items-start gap-3.5 sm:gap-5">
                  <div
                    onClick={() => setSelectedSong(song)}
                    className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer block"
                    title={`Click to view ${song.title}`}
                  >
                    <img
                      src={coverImage}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-pink-500/80 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        {song.isVoiceNote ? (
                          <Mic className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5 text-white fill-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3
                        onClick={() => setSelectedSong(song)}
                        className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-pink-200 transition-colors cursor-pointer break-words line-clamp-1"
                      >
                        {song.title}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${badge.badgeClass}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-purple-200/90 font-medium truncate">
                      {song.artist}
                    </p>

                    {song.isVoiceNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-300 bg-pink-500/15 px-2 py-0.5 rounded-full border border-pink-400/30">
                        <Mic className="w-3 h-3 text-pink-300" />
                        <span>Voice Note Attachment</span>
                      </span>
                    )}

                    {song.message && (
                      <p className="text-xs text-pink-100/90 font-serif italic line-clamp-2 leading-relaxed pt-0.5">
                        “{song.message}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Embedded Audio Player if uploaded audio / voice note exists, or direct Spotify Player */}
                {song.audioUrl ? (
                  <div className="pt-1">
                    <GardenAudioPlayer
                      src={song.audioUrl}
                      title={song.title}
                      subtitle={song.artist}
                      isVoiceNote={song.isVoiceNote}
                    />
                  </div>
                ) : song.isVoiceNote ? (
                  <div className="pt-1">
                    <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-400/30 flex items-center gap-2.5 text-xs text-pink-200">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                        <Mic className="w-3.5 h-3.5 text-pink-300" />
                      </div>
                      <span className="font-mono text-[11px] text-pink-200/90">
                        Heartfelt voice note memo
                      </span>
                    </div>
                  </div>
                ) : isSpotifyUrl(song.musicUrl) ? (
                  <div className="pt-1">
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-[#0e0e14]/90 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-spotify text-black flex items-center justify-center shrink-0 shadow-md">
                          <SpotifyIcon className="w-4 h-4" style={{ fill: '#000000' }} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            Spotify Track
                          </span>
                          <span className="text-[10px] text-spotify block font-mono">
                            Tap to play full song in Spotify
                          </span>
                        </div>
                      </div>

                      <a
                        href={song.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-spotify inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        title="Play in Spotify App"
                      >
                        <Play className="w-3.5 h-3.5" style={{ fill: '#000000', color: '#000000' }} />
                        <span>Play Track ↗</span>
                      </a>
                    </div>
                  </div>
                ) : null}

                {/* Footer Row: Contributor + Reaction + Action Button */}
                <div className="pt-3 border-t border-purple-400/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-[10px] text-purple-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-purple-200/90 truncate">
                      By: {isAddedByMe ? 'You' : song.addedByName || partner.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(song)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 text-[10px] sm:text-[11px] text-pink-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle reaction"
                    >
                      <span>{song.reaction || 'Love it! 💖'}</span>
                    </button>

                    {isSpotifyUrl(song.musicUrl) ? (
                      <a
                        href={song.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-spotify-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Open in Spotify App"
                      >
                        <SpotifyIcon className="w-3.5 h-3.5" style={{ fill: '#1db954' }} />
                        <span>Spotify ↗</span>
                      </a>
                    ) : song.musicUrl ? (
                      <a
                        href={song.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-white/[0.06] hover:bg-purple-500/30 border border-white/10 text-purple-200 hover:text-white transition-all"
                        title="Open external music link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}

                    <button
                      onClick={() => setSelectedSong(song)}
                      className="btn-glow-romantic text-[11px] py-1 px-3 shadow-sm"
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Details Modal */}
      {selectedSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedSong(null)}
        >
          <div
            className="glass-midnight-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-300/80 uppercase tracking-wider">
                <Music className="w-4 h-4 text-pink-300" />
                <span>Track Details</span>
              </div>
              <button
                onClick={() => setSelectedSong(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
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

              <div className="space-y-1 min-w-0">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white truncate">{selectedSong.title}</h3>
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
              {selectedSong.addedBy === currentUser.id ? (
                <button
                  onClick={() => handleDelete(selectedSong)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Track</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-purple-300/60">
                  Shared by {selectedSong.addedByName || partner.displayName}
                </span>
              )}

              {selectedSong.musicUrl ? (
                isSpotifyUrl(selectedSong.musicUrl) ? (
                  <a
                    href={selectedSong.musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-spotify inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
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
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Choice: Upload Audio File or Record Voice Note */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowRecorder(false);
                }}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  audioUrl && !isVoiceNote
                    ? 'bg-purple-500/25 border-purple-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-purple-200 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-300" />
                <span>Upload Audio File</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(!showRecorder)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  showRecorder || isVoiceNote
                    ? 'bg-pink-500/25 border-pink-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-pink-200 hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4 text-pink-300" />
                <span>Record Voice Note</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* In-Browser Voice Recorder */}
            {showRecorder && (
              <VoiceNoteRecorder
                onRecorded={handleVoiceNoteRecorded}
                onCancel={() => setShowRecorder(false)}
              />
            )}

            {/* Attached Audio Preview */}
            {audioUrl && (
              <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-400/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-pink-200">
                  <span className="flex items-center gap-1.5 font-mono">
                    <FileAudio className="w-4 h-4 text-pink-400" />
                    <span>{audioFileName || (isVoiceNote ? 'Voice Note' : 'Audio Track')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUrl(undefined);
                      setAudioFileName(undefined);
                      setIsVoiceNote(false);
                    }}
                    className="text-slate-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
                <GardenAudioPlayer
                  src={audioUrl}
                  title={title || 'Audio Preview'}
                  subtitle={isVoiceNote ? 'Voice Note' : 'Uploaded Track'}
                  isVoiceNote={isVoiceNote}
                />
              </div>
            )}

            <form onSubmit={handleSaveSong} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="form-field-label">
                    <span>Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flying or Our Voice Memo"
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
                    placeholder={`e.g. Tom Odell or ${currentUser.displayName}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="form-field-label mb-0">
                    <span>Music Link (Spotify, YouTube, Apple Music) — Optional</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => openSpotifySearch(title || artist || '')}
                    className="btn-spotify-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="Find song on Spotify"
                  >
                    <SpotifyIcon className="w-3.5 h-3.5" style={{ fill: '#1db954' }} />
                    <span>Search Spotify</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={musicUrl}
                    onChange={(e) => handleMusicUrlChange(e.target.value)}
                    placeholder="Paste link: https://open.spotify.com/track/... or YouTube"
                    className="w-full pr-16"
                  />
                  <button
                    type="button"
                    onClick={handlePasteMusicUrl}
                    className="absolute right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] font-mono transition-all"
                  >
                    Paste
                  </button>
                </div>

                {spotifyLoading && (
                  <p className="text-[11px] font-mono text-emerald-300 animate-pulse">
                    Connecting to Spotify & fetching song details...
                  </p>
                )}

                {spotifyDetected && (
                  <div className="badge-spotify p-3 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
                    {spotifyDetected.thumbnail ? (
                      <img
                        src={spotifyDetected.thumbnail}
                        alt="Album Cover"
                        className="w-11 h-11 rounded-xl object-cover shadow border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-spotify/20 flex items-center justify-center shrink-0">
                        <SpotifyIcon className="w-5 h-5" style={{ fill: '#1db954' }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-xs text-white block truncate">
                        {spotifyDetected.title || 'Spotify Track'}
                      </span>
                      <span className="text-[11px] text-spotify block truncate">
                        {spotifyDetected.artist ? `by ${spotifyDetected.artist}` : 'Album cover linked automatically'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold font-mono shrink-0">
                      Linked ✓
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-field-label">
                  <span>Why You Love It / Memory Behind It</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. The song that reminds me of our long talks..."
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
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Share Song or Note 🎵</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
