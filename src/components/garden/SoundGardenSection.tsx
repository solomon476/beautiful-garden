import React, { useState, useEffect } from 'react';
import {
  Music,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Play,
  Filter,
  Sparkles,
} from 'lucide-react';
import { soundGardenService, authService } from '../../services/gardenService';
import type { SongEntry, SongStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

export const SoundGardenSection: React.FC = () => {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | SongStatus>('all');

  // Modal states
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [musicUrl, setMusicUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [status, setStatus] = useState<SongStatus>('want_to_listen');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setArtist('');
    setMusicUrl('');
    setMessage('');
    setStatus('want_to_listen');
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setErrorMsg('Please enter both a song title and artist.');
      return;
    }
    if (!musicUrl.trim() || (!musicUrl.startsWith('http://') && !musicUrl.startsWith('https://'))) {
      setErrorMsg('Please enter a valid Spotify, YouTube, or Apple Music link.');
      return;
    }

    try {
      await soundGardenService.addSong({
        title,
        artist,
        musicUrl,
        message,
        status,
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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup */}
      <section
        className="relative rounded-3xl overflow-hidden border border-purple-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(29, 14, 53, 0.94) 0%, rgba(15, 7, 30, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
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

        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-purple-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/hero_sound.jpg"
                alt="Sound Garden Headphones"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="w-8 h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ The Sound Garden</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Sound Garden</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-purple-200/90 max-w-xl leading-relaxed">
                Songs for road trips, quiet late nights, and inside memories.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-purple-300/70 pt-1">
                Discover • Listen • Share • Remember
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
            >
              <Music className="w-4 h-4 text-white" />
              <span>Recommend a Song</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Songs Grid — 2 Column Responsive Glass Cards matching Mockup */}
      {loading ? (
        <div className="py-16 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Tuning the Sound Garden frequencies...
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-4 border border-purple-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-2xl text-white">No tracks in this view yet</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            {activeFilter === 'all'
              ? 'Share a song that means something to you and start our shared soundtrack.'
              : `No tracks currently marked as "${activeFilter.replace(/_/g, ' ')}".`}
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Song 🎵</span>
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
                className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-pink-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 20, 68, 0.65) 0%, rgba(20, 10, 40, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Left Square Artwork with Hover Play Button */}
                  <a
                    href={song.musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer block"
                    style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px', maxWidth: '112px', maxHeight: '112px' }}
                    title={`Listen to ${song.title} on Spotify / YouTube`}
                  >
                    <img
                      src={coverImage}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover/cover:bg-black/15 transition-colors" />

                    {/* Circular Translucent Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-purple-950 flex items-center justify-center shadow-lg transform group-hover/cover:scale-110 active:scale-95 transition-all">
                        <Play className="w-4 h-4 fill-purple-950 text-purple-950 ml-0.5" />
                      </div>
                    </div>
                  </a>

                  {/* Right Column: Title, Status, Date, Artist & Note */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title + Status Badge + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors truncate">
                        {song.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${badge.badgeClass}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[11px] text-purple-300/70 font-mono">
                          {new Date(song.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Artist */}
                    <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
                      {song.artist}
                    </p>

                    {/* Personal Romantic Note */}
                    {song.message ? (
                      <p className="text-xs text-pink-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                        “{song.message}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className="text-xs text-purple-300/60 font-serif italic line-clamp-1 pt-1">
                        Added to the shared garden melody...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + View Details Button */}
                <div className="pt-3 border-t border-purple-400/20 flex items-center justify-between gap-3 text-xs">
                  {/* Contributor Avatar & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-[11px] text-pink-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-purple-200/90 truncate">
                      By: {isAddedByMe ? 'You' : song.addedByName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & View Details Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(song)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 text-[11px] text-pink-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle romantic reaction"
                    >
                      <span>💖</span>
                      <span>{song.reaction || 'Love it!'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedSong(song)}
                      className="btn-glow-romantic text-[11px] py-1 px-3.5 shadow-sm"
                    >
                      <span>View Details</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Action & Filter Section — Matching Mockup */}
      <section className="flex flex-col lg:flex-row gap-5 sm:gap-6 pt-2 w-full">
        {/* Left Card: Add Your Own Recommendation Banner (~7 Cols) */}
        <div
          className="rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 justify-between border border-purple-400/30 shadow-xl"
          style={{
            flex: '1.35 1 0%',
            background: 'linear-gradient(135deg, rgba(32, 16, 56, 0.7) 0%, rgba(18, 9, 36, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
            <div
              className="rounded-2xl overflow-hidden border border-pink-400/30 shrink-0 shadow-lg group"
              style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
            >
              <img
                src="/assets/garden/card_sound.jpg"
                alt="Vinyl Record"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Add Your Own Recommendation
              </h4>
              <p className="text-xs sm:text-sm text-purple-200/80 font-light leading-relaxed">
                Share a song, artist or playlist that means something to you.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Add a Song →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters (~5 Cols) */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 border border-purple-400/30 shadow-xl"
          style={{
            flex: '1 1 0%',
            background: 'linear-gradient(135deg, rgba(28, 14, 50, 0.7) 0%, rgba(16, 8, 32, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300/80 uppercase tracking-wider">
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
                    : 'bg-white/[0.05] border border-white/10 text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🎵 All
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('listened');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'listened'
                    ? 'bg-emerald-500/30 border border-emerald-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✔ Listened
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('want_to_listen');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'want_to_listen'
                    ? 'bg-amber-500/30 border border-amber-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ⭐ Want to Listen
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('recommend_back');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'recommend_back'
                    ? 'bg-fuchsia-500/30 border border-fuchsia-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                💖 Recommend Back
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-purple-400/15 flex items-center justify-between text-xs text-purple-300/80">
            <span className="font-serif italic text-pink-200/90 text-sm">
              Music is better together ♡
            </span>
            <span className="text-base">🌸</span>
          </div>
        </div>
      </section>

      {/* 4. Details / Playback Modal */}
      {selectedSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedSong(null)}
        >
          <div
            className="glass-midnight-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
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

            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shrink-0 shadow-lg">
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
                <h3 className="font-serif text-2xl font-bold text-white truncate">{selectedSong.title}</h3>
                <p className="text-sm text-purple-200/90 font-medium">{selectedSong.artist}</p>
                <div className="pt-1">
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
            </div>

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

            <div className="space-y-3 pt-2">
              <label className="text-xs font-mono uppercase tracking-wider text-purple-300/80 block">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['want_to_listen', 'listened', 'recommend_back'] as SongStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedSong.id, st)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      selectedSong.status === st
                        ? 'bg-pink-500/30 border-pink-400/60 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] border-white/10 text-purple-200/70 hover:text-white'
                    }`}
                  >
                    {st === 'want_to_listen' && '🎧 Want to Listen'}
                    {st === 'listened' && '✨ Listened'}
                    {st === 'recommend_back' && '💖 Recommend'}
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

              <a
                href={selectedSong.musicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow-romantic text-xs py-2 px-5 flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Music App</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Song Modal Form */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300">
                  <Music className="w-4 h-4 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add a Soundtrack Gem
                  </h4>
                  <p className="text-[11px] text-purple-200/70 font-mono uppercase tracking-wider">
                    Shared Playlist Recommendation
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

            <form onSubmit={handleSaveSong} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-field-label">
                    <span>Song Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flying"
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Artist or Creator *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Tom Odell"
                  />
                </div>
              </div>

              <div>
                <label className="form-field-label">
                  <span>Music Link (Spotify, YouTube, Apple Music) *</span>
                </label>
                <input
                  type="url"
                  required
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/... or https://youtube.com/..."
                />
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-400/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Share Song 🎵</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
