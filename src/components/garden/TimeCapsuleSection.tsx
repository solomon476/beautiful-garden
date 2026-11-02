import React, { useState, useEffect } from 'react';
import {
  Hourglass,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';
import { timeCapsuleService, authService } from '../../services/gardenService';
import type { TimeCapsuleEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

export const TimeCapsuleSection: React.FC = () => {
  const [capsules, setCapsules] = useState<TimeCapsuleEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read Modal
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsuleEntry | null>(null);

  const partner = authService.getPartner();

  const loadCapsules = async () => {
    try {
      setLoading(true);
      const list = await timeCapsuleService.getCapsules();
      setCapsules(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapsules();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadCapsules();
    });
    return unsubscribe;
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playSparkle();
    setTitle('');
    setBody('');
    // Default to 1 week in future
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setReleaseDate(nextWeek.toISOString().slice(0, 10));
    setIsShared(true);
    setErrorMsg(null);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !releaseDate) {
      setErrorMsg('Please fill in title, message, and choose an opening date.');
      return;
    }

    const releaseTime = new Date(releaseDate).toISOString();

    try {
      await timeCapsuleService.createCapsule({
        title,
        body,
        releaseAt: releaseTime,
        isShared,
      });

      soundEngine.playHarpStrum();
      setIsCreating(false);
      await loadCapsules();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not seal time capsule.');
    }
  };

  const handleDelete = async (cap: TimeCapsuleEntry) => {
    if (cap.authorId !== currentUser.id) return;
    if (window.confirm(`Delete time capsule "${cap.title}"?`)) {
      await timeCapsuleService.deleteCapsule(cap.id);
      if (selectedCapsule?.id === cap.id) setSelectedCapsule(null);
      await loadCapsules();
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Hourglass className="w-3.5 h-3.5" />
            <span>Time Capsule</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Future Letters & Sealed Memories
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Write a letter to be unlocked on a specific future date. Content is securely locked until the day arrives.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Seal a New Capsule</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Seal a Future Message
            </span>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Capsule Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. For Our Next Milestone..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Unlock Date *
                </label>
                <input
                  type="date"
                  required
                  value={releaseDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                The Sealed Message *
              </label>
              <textarea
                rows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What do you want to say to your future selves? This message will remain strictly locked until the release date..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {isShared ? `Intended for: ${partner.displayName}` : 'Private to you in the future'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isShared
                    ? 'bg-pink-500/20 text-pink-200 border-pink-400/30'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? `For ${partner.displayName} 💌` : 'Personal Future Note'}
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md"
              >
                Lock & Seal Capsule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Capsules */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Consulting the hourglass...
        </div>
      ) : capsules.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <Hourglass className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">No Time Capsules Sealed Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Seal a note to be opened next month, next birthday, or a future anniversary.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Create Time Capsule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capsules.map((cap) => {
            const isAuthor = cap.authorId === currentUser.id;
            const release = new Date(cap.releaseAt);
            const isUnlocked = release <= now;
            const diffDays = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={cap.id}
                onClick={() => {
                  if (isUnlocked || isAuthor) {
                    setSelectedCapsule(cap);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                  isUnlocked
                    ? 'bg-slate-900/70 border-emerald-400/30 hover:border-emerald-300 cursor-pointer'
                    : 'bg-slate-900/40 border-amber-400/20 cursor-default'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                        isUnlocked
                          ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                      }`}
                    >
                      {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      {isUnlocked ? 'Unlocked & Ready to Read' : `Sealed (${diffDays} days left)`}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {release.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-white mb-1">
                    {cap.title}
                  </h4>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {isUnlocked || isAuthor ? (
                      cap.body
                    ) : (
                      <span className="italic text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        This message is locked until {release.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                      </span>
                    )}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Author: {isAuthor ? 'You' : cap.authorName || partner.displayName}</span>

                  <div className="flex items-center gap-2">
                    {(isUnlocked || isAuthor) && (
                      <button
                        onClick={() => setSelectedCapsule(cap)}
                        className="text-xs text-pink-300 hover:text-pink-200 hover:underline"
                      >
                        Read
                      </button>
                    )}

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(cap)}
                        className="p-1 hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                        title="Delete capsule"
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

      {/* Reader Modal */}
      {selectedCapsule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedCapsule(null)}
        >
          <div
            className="max-w-md w-full bg-slate-900 border border-pink-400/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCapsule(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-pink-500/20 text-pink-300 border border-pink-400/30">
              <Hourglass className="w-3.5 h-3.5" />
              <span>Time Capsule Unsealed</span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-white">
              {selectedCapsule.title}
            </h3>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 max-h-72 overflow-y-auto">
              <p className="text-sm text-slate-200 leading-relaxed font-light whitespace-pre-line">
                {selectedCapsule.body}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-2 border-t border-white/10">
              <span>By: {selectedCapsule.authorId === currentUser.id ? 'You' : selectedCapsule.authorName || partner.displayName}</span>
              <span>Target: {new Date(selectedCapsule.releaseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
