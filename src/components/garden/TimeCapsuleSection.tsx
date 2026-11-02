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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-400/15">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Hourglass className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Capsule</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Future Letters & Sealed Milestone Envelopes
          </h3>
          <p className="font-handwriting text-lg text-amber-200/80 mt-0.5">
            Write a message to be unlocked on a specific future date. Server-enforced privacy keeps it sealed until then.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Seal a New Capsule</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="glass-parchment-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Seal a Future Capsule
            </span>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                  Capsule Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. For Our Next Anniversary..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                  Unlock Date *
                </label>
                <input
                  type="date"
                  required
                  value={releaseDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                The Sealed Message *
              </label>
              <textarea
                rows={6}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What do you want to say to your future selves? This letter will remain strictly sealed and locked until the release date arrives..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner resize-y font-light leading-relaxed"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-amber-400/25 flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {isShared ? `Recipient: ${partner.displayName}` : 'Private to you in the future'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isShared
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-sm'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? `For ${partner.displayName} 💌` : 'Personal Future Note'}
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-300">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-amber-500/25 border border-white/20"
              >
                Seal with Golden Wax 🌟
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Capsules */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Consulting celestial hourglass...
        </div>
      ) : capsules.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Hourglass className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl text-white">No Sealed Capsules Yet</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Seal a note to be opened next month, on a birthday, or during a future adventure together.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-200 text-xs font-medium border border-amber-400/30 transition-all hover:scale-105"
          >
            Create Time Capsule ⏳
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                className={`glass-midnight-card group p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 shadow-md relative ${
                  isUnlocked
                    ? 'border-emerald-400/40 hover:border-emerald-300 cursor-pointer shadow-emerald-500/10'
                    : 'border-amber-400/30 cursor-default shadow-amber-500/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${
                        isUnlocked
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                          : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      }`}
                    >
                      {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {isUnlocked ? 'Unlocked & Ready to Read' : `Sealed (${diffDays} days left)`}
                    </span>

                    <span className="text-[11px] text-amber-200/90 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {release.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-white mb-1.5 group-hover:text-amber-200 transition-colors">
                    {cap.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                    {isUnlocked || isAuthor ? (
                      cap.body
                    ) : (
                      <span className="italic text-slate-400 flex items-center gap-1.5 font-light">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        This message is locked until {release.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                      </span>
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="font-handwriting text-base text-amber-300">
                    Author: {isAuthor ? 'You' : cap.authorName || partner.displayName}
                  </span>

                  <div className="flex items-center gap-2">
                    {(isUnlocked || isAuthor) && (
                      <button
                        onClick={() => setSelectedCapsule(cap)}
                        className="text-xs text-amber-300 hover:text-amber-200 hover:underline font-semibold"
                      >
                        Unseal & Read
                      </button>
                    )}

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(cap)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors opacity-70 hover:opacity-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedCapsule(null)}
        >
          <div
            className="max-w-md w-full glass-parchment-card border border-amber-400/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCapsule(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-200 border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Time Capsule Unsealed</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {selectedCapsule.title}
            </h3>

            <div className="p-5 rounded-2xl bg-black/30 border border-amber-400/25 max-h-72 overflow-y-auto shadow-inner">
              <p className="font-handwriting text-2xl text-amber-100 leading-relaxed whitespace-pre-line">
                “{selectedCapsule.body}”
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-3 border-t border-purple-400/15">
              <span>Author: {selectedCapsule.authorId === currentUser.id ? 'You' : selectedCapsule.authorName || partner.displayName}</span>
              <span>Target: {new Date(selectedCapsule.releaseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
