import React, { useState, useEffect } from 'react';
import {
  Music,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  MessageSquare,
  X,
  Disc3,
  Radio,
} from 'lucide-react';
import { soundGardenService, authService } from '../../services/gardenService';
import type { SongEntry, SongStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

export const SoundGardenSection: React.FC = () => {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Modal / Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
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
  };

  const handleDelete = async (song: SongEntry) => {
    if (song.addedBy !== currentUser.id) return;
    if (window.confirm(`Remove "${song.title}" from recommendations?`)) {
      await soundGardenService.deleteSong(song.id);
      await loadSongs();
    }
  };

  const getStatusBadge = (s: SongStatus) => {
    switch (s) {
      case 'want_to_listen':
        return { label: 'Want to Listen 🎧', color: 'bg-amber-500/20 border-amber-400/40 text-amber-200' };
      case 'listened':
        return { label: 'Listened ✨', color: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' };
      case 'recommend_back':
        return { label: 'Recommend Back 💖', color: 'bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-200' };
      default:
        return { label: s, color: 'bg-white/10 text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-purple-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-[10px] font-mono uppercase tracking-widest">
            <Radio className="w-3 h-3 text-purple-300 animate-pulse" />
            <span>Sound Garden</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Soundtracks & Shared Playlists
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 font-light leading-relaxed max-w-xl">
            Songs for road trips, quiet late nights, and inside memories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-glow-romantic self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Recommend a Song</span>
        </button>
      </div>

      {/* Add Song Form Modal / Card */}
      {isAdding && (
        <div className="glass-vinyl-card p-6 sm:p-7 rounded-2xl space-y-4 animate-fade-in relative overflow-hidden border border-purple-400/30 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-purple-400/15">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-200 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              Add a Soundtrack Gem
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSong} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mystery of Love"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#120b24]/80 border border-purple-400/25 text-white text-sm focus:outline-none focus:border-pink-400 transition-colors placeholder:text-purple-300/30 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Artist *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Sufjan Stevens"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#120b24]/80 border border-purple-400/25 text-white text-sm focus:outline-none focus:border-pink-400 transition-colors placeholder:text-purple-300/30 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                Authorized Music Link (Spotify, YouTube, Apple Music) *
              </label>
              <input
                type="url"
                required
                value={musicUrl}
                onChange={(e) => setMusicUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/... or https://youtube.com/..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#120b24]/80 border border-purple-400/25 text-white text-sm focus:outline-none focus:border-pink-400 transition-colors placeholder:text-purple-300/30 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Why You Recommend It (Optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. The piano in this song is unbelievable..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#120b24]/80 border border-purple-400/25 text-white text-sm focus:outline-none focus:border-pink-400 transition-colors placeholder:text-purple-300/30 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SongStatus)}
                  className="garden-select w-full py-2 px-3 text-xs"
                >
                  <option value="want_to_listen">Want to listen</option>
                  <option value="listened">Listened ✨</option>
                  <option value="recommend_back">Recommend back 💖</option>
                </select>
              </div>
            </div>

            {errorMsg && <p className="text-xs text-rose-300 pt-1">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-purple-400/15">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-glow-romantic text-xs"
              >
                <span>Share Song 🎵</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Song Grid */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Tuning the Sound Garden frequencies...
        </div>
      ) : songs.length === 0 ? (
        <div className="glass-vinyl-card p-10 rounded-2xl text-center space-y-3.5 border border-purple-400/25">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Music className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl text-white">The Sound Garden Awaits Its First Track</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            Recommend a song to {partner.displayName}. Add a Spotify or YouTube link and explain why you love it.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Song 🎵</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {songs.map((song) => {
            const isAddedByMe = song.addedBy === currentUser.id;
            const badge = getStatusBadge(song.status);

            return (
              <div
                key={song.id}
                className="glass-vinyl-card group p-5 sm:p-6 rounded-2xl hover:border-purple-400/40 transition-all flex flex-col justify-between space-y-4 shadow-lg relative"
              >
                <div className="space-y-3.5">
                  {/* Status Badge & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-[11px] text-purple-300/60 font-mono">
                      {new Date(song.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Artwork & Song Details */}
                  <div className="flex items-start gap-3.5">
                    {/* Vinyl Sleeve Art Tile */}
                    <div className="vinyl-sleeve-tile group-hover:border-pink-400/50 transition-colors">
                      <div className="vinyl-grooves-overlay" />
                      <Disc3 className="w-7 h-7 text-pink-300/90 animate-spin" style={{ animationDuration: '10s' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-pink-200 transition-colors truncate">
                        {song.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-purple-200/80 font-medium truncate mt-0.5">
                        {song.artist}
                      </p>

                      <a
                        href={song.musicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-pink-500/20 text-purple-200 hover:text-white border border-purple-300/20 text-[11px] font-medium transition-all"
                        title="Listen via Spotify / YouTube"
                        aria-label={`Open link for ${song.title}`}
                      >
                        <ExternalLink className="w-3 h-3 text-pink-300" />
                        <span>Listen Now</span>
                      </a>
                    </div>
                  </div>

                  {/* Personal Recommendation Whisper Note */}
                  {song.message && (
                    <div className="quote-whisper-bubble flex items-start gap-2.5">
                      <MessageSquare className="w-3.5 h-3.5 text-pink-300 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-100/90 font-light italic leading-relaxed line-clamp-3">
                        “{song.message}”
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Contributor & Styled Status Select */}
                <div className="pt-3.5 border-t border-purple-400/15 flex items-center justify-between gap-3 text-xs">
                  <span className="font-handwriting text-xl text-pink-200/90 font-medium truncate">
                    Rec by: {isAddedByMe ? 'You 🌷' : (song.addedByName || partner.displayName) + ' ✨'}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Custom Styled Status Select */}
                    <select
                      value={song.status}
                      onChange={(e) => handleStatusChange(song.id, e.target.value as SongStatus)}
                      className="garden-select"
                      aria-label={`Status for ${song.title}`}
                    >
                      <option value="want_to_listen">Want to listen</option>
                      <option value="listened">Listened ✨</option>
                      <option value="recommend_back">Recommend back 💖</option>
                    </select>

                    {isAddedByMe && (
                      <button
                        onClick={() => handleDelete(song)}
                        className="p-1.5 rounded-full hover:bg-rose-500/20 text-purple-300/70 hover:text-rose-300 transition-colors"
                        title="Delete recommendation"
                        aria-label={`Delete ${song.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Invitation / Add Track Companion Card */}
          {songs.length < 4 && (
            <div
              onClick={handleOpenAdd}
              className="group p-6 rounded-2xl border border-dashed border-purple-400/25 hover:border-pink-300/50 bg-gradient-to-br from-purple-500/[0.04] to-transparent hover:bg-purple-500/[0.08] flex flex-col justify-center items-center text-center space-y-3 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-white group-hover:text-pink-200 transition-colors">
                  Recommend Another Track
                </h4>
                <p className="text-xs text-purple-200/70 max-w-xs mx-auto leading-relaxed font-light">
                  Add a song for road trips, late nights, or inside memories.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-purple-200 border border-purple-300/20 group-hover:border-pink-300/40 group-hover:bg-pink-500/20 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Track
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
