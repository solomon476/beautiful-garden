import React, { useState, useEffect } from 'react';
import {
  Music,
  ExternalLink,
  Plus,
  Trash2,
  Headphones,
  Sparkles,
  MessageSquare,
  X,
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
      setErrorMsg('Please enter a valid Spotify, YouTube, or Apple Music URL.');
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
        return { label: 'Want to Listen', color: 'bg-amber-500/15 border-amber-400/30 text-amber-300' };
      case 'listened':
        return { label: 'Listened ✨', color: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' };
      case 'recommend_back':
        return { label: 'Recommend Back 💖', color: 'bg-pink-500/15 border-pink-400/30 text-pink-300' };
      default:
        return { label: s, color: 'bg-white/10 text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Headphones className="w-3.5 h-3.5" />
            <span>The Sound Garden</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Music Recommendations & Soundtracks
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Share favorite tracks, songs that remind you of each other, and playlist gems.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Recommend a Song</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recommend Music
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSong} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mystery of Love"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Artist *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Sufjan Stevens"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Authorized Listening Link (Spotify, YouTube, Apple Music) *
              </label>
              <input
                type="url"
                required
                value={musicUrl}
                onChange={(e) => setMusicUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/... or https://youtube.com/..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Personal Note / Why You Love It (Optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Heard this while walking today and instantly thought of you..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SongStatus)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              >
                <option value="want_to_listen">Want to listen</option>
                <option value="listened">Listened</option>
                <option value="recommend_back">Recommend back</option>
              </select>
            </div>

            {errorMsg && <p className="text-xs text-rose-400 pt-1">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md transition-all"
              >
                Share Song
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Song List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Tuning into the Sound Garden...
        </div>
      ) : songs.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <Music className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">No Songs Recommended Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Recommend a song to {partner.displayName}. Add a Spotify or YouTube link along with a personal note.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Add First Song
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {songs.map((song) => {
            const isAddedByMe = song.addedBy === currentUser.id;
            const badge = getStatusBadge(song.status);

            return (
              <div
                key={song.id}
                className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-pink-400/30 transition-all flex flex-col justify-between space-y-3 shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(song.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-400/20 flex items-center justify-center text-pink-300 shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold text-white group-hover:text-pink-200 transition-colors">
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-light">{song.artist}</p>
                      </div>
                    </div>

                    <a
                      href={song.musicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-200 border border-white/10 transition-colors shrink-0"
                      title="Listen via external link"
                      aria-label={`Open link for ${song.title}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {song.message && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-xs text-slate-300 font-light italic">
                      <MessageSquare className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                      <span>“{song.message}”</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Rec by: {isAddedByMe ? 'You' : song.addedByName || partner.displayName}</span>

                  <div className="flex items-center gap-2">
                    {/* Status toggles */}
                    <select
                      value={song.status}
                      onChange={(e) => handleStatusChange(song.id, e.target.value as SongStatus)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white focus:outline-none"
                    >
                      <option value="want_to_listen">Want to listen</option>
                      <option value="listened">Listened</option>
                      <option value="recommend_back">Recommend back</option>
                    </select>

                    {isAddedByMe && (
                      <button
                        onClick={() => handleDelete(song)}
                        className="p-1 hover:text-rose-400 transition-colors opacity-80 hover:opacity-100"
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
