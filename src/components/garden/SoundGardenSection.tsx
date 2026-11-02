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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-400/15">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>The Sound Garden</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Shared Soundtracks & Music Recommendations
          </h3>
          <p className="font-handwriting text-lg text-purple-200/80 mt-0.5">
            Songs for road trips, quiet late nights, and inside memories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Recommend a Song</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="glass-vinyl-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              Add a Soundtrack Gem
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSong} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mystery of Love"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-purple-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                  Artist *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Sufjan Stevens"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-purple-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                Authorized Music Link (Spotify, YouTube, Apple Music) *
              </label>
              <input
                type="url"
                required
                value={musicUrl}
                onChange={(e) => setMusicUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/... or https://youtube.com/..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-purple-400 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                Why You Recommend It (Optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. The piano in this song is unbelievable..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-purple-400 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-purple-200/70 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SongStatus)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-purple-400 shadow-inner"
              >
                <option value="want_to_listen">Want to listen</option>
                <option value="listened">Listened</option>
                <option value="recommend_back">Recommend back</option>
              </select>
            </div>

            {errorMsg && <p className="text-xs text-rose-300 pt-1">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all border border-white/20"
              >
                Share Song 🎵
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Song List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Tuning the Sound Garden frequencies...
        </div>
      ) : songs.length === 0 ? (
        <div className="glass-vinyl-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl text-white">The Sound Garden Awaits Its First Track</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Recommend a song to {partner.displayName}. Add a Spotify or YouTube link and explain why you love it.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 text-xs font-medium border border-purple-400/30 transition-all hover:scale-105"
          >
            Add First Song 🎵
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {songs.map((song) => {
            const isAddedByMe = song.addedBy === currentUser.id;
            const badge = getStatusBadge(song.status);

            return (
              <div
                key={song.id}
                className="glass-vinyl-card group p-5 sm:p-6 rounded-2xl hover:border-purple-400/50 transition-all flex flex-col justify-between space-y-3 shadow-md relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(song.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {/* Vinyl Groove Icon */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900 to-indigo-950 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/15 shrink-0 group-hover:scale-110 transition-transform">
                        <Disc3 className="w-6 h-6 animate-spin text-pink-300" style={{ animationDuration: '8s' }} />
                      </div>
                      <div>
                        <h4 className="font-serif text-lg font-bold text-white group-hover:text-purple-200 transition-colors">
                          {song.title}
                        </h4>
                        <p className="text-xs text-purple-200/80 font-mono">{song.artist}</p>
                      </div>
                    </div>

                    <a
                      href={song.musicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 text-purple-200 border border-purple-400/30 transition-all hover:scale-110 shrink-0 shadow-sm"
                      title="Listen via Spotify / YouTube"
                      aria-label={`Open link for ${song.title}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {song.message && (
                    <div className="mt-3.5 p-3 rounded-xl bg-purple-950/30 border border-purple-400/20 flex items-start gap-2 text-xs text-slate-200 font-light italic">
                      <MessageSquare className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                      <span>“{song.message}”</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="font-handwriting text-base text-purple-300">
                    Rec by: {isAddedByMe ? 'You' : song.addedByName || partner.displayName}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Status toggles */}
                    <select
                      value={song.status}
                      onChange={(e) => handleStatusChange(song.id, e.target.value as SongStatus)}
                      className="px-2.5 py-1 rounded-xl bg-purple-950/50 border border-purple-400/30 text-[11px] text-purple-200 hover:text-white focus:outline-none"
                    >
                      <option value="want_to_listen">Want to listen</option>
                      <option value="listened">Listened ✨</option>
                      <option value="recommend_back">Recommend back 💖</option>
                    </select>

                    {isAddedByMe && (
                      <button
                        onClick={() => handleDelete(song)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors opacity-80 hover:opacity-100"
                        title="Delete recommendation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
