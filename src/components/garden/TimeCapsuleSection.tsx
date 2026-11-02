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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-amber-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[10px] font-mono uppercase tracking-widest">
            <Hourglass className="w-3 h-3 text-amber-300" />
            <span>Time Capsule</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Future Letters & Sealed Milestone Envelopes
          </h3>
          <p className="text-xs sm:text-sm text-amber-200/80 font-light leading-relaxed max-w-xl">
            Write a message to be unlocked on a specific future date. Server-enforced privacy keeps it sealed until then.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-glow-romantic self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Seal a New Capsule</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="glass-parchment-card max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] space-y-6 sm:space-y-7 animate-fade-in relative overflow-hidden border border-amber-400/35 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-amber-400/20">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                <Hourglass className="w-4 h-4 text-amber-300" />
              </span>
              <div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                  Seal a Future Capsule
                </h4>
                <p className="text-[11px] text-amber-200/70 font-mono uppercase tracking-wider">
                  Milestone envelope locked until chosen date
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="form-field-label">
                  <span>Capsule Title *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Open on Our Next Anniversary..."
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Unlock Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={releaseDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">
                <span>The Sealed Message *</span>
              </label>
              <textarea
                rows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What do you want to say to your future selves? This letter will remain strictly sealed and encrypted until the release date arrives..."
              />
            </div>

            {/* Decorated Privacy Switch */}
            <DecoratedPrivacyToggle
              isShared={isShared}
              onToggle={setIsShared}
              partnerName={partner.displayName}
              sharedTitle={`Seal Milestone Capsule for ${partner.displayName}`}
              sharedSubtitle={`Sealed with golden wax on the server. ${partner.displayName} will be notified and able to open it on the unlock date ✨`}
              privateTitle="Personal Future Capsule (Self Only)"
              privateSubtitle="A private time capsule for your eyes only on the unlock date. Sealed from partner 🔒"
            />

            {errorMsg && (
              <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-400/20">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-glow-romantic"
              >
                <Hourglass className="w-4 h-4" />
                <span>Seal with Golden Wax 🌟</span>
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
        <div className="glass-midnight-card p-8 sm:p-10 rounded-2xl text-center space-y-3.5 border border-amber-400/20">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Hourglass className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="font-serif text-lg sm:text-xl text-white font-bold">No Sealed Capsules Yet</h4>
          <p className="text-xs sm:text-sm text-amber-200/70 max-w-md mx-auto font-light leading-relaxed">
            Seal a note to be opened next month, on a birthday, or during a future adventure together.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-400/30 transition-all hover:scale-105"
          >
            Create Time Capsule ⏳
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
                className={`glass-midnight-card group p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 shadow-xl relative min-h-[200px] ${
                  isUnlocked
                    ? 'border-emerald-400/40 hover:border-emerald-300 cursor-pointer shadow-emerald-500/10'
                    : 'border-amber-400/30 cursor-default shadow-amber-500/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${
                        isUnlocked
                          ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                          : 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                      }`}
                    >
                      {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {isUnlocked ? 'Unlocked & Ready to Read ✨' : `Sealed (${diffDays}d left) 🔐`}
                    </span>

                    <span className="text-[11px] text-amber-200/80 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {release.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white mb-1.5 group-hover:text-amber-200 transition-colors">
                    {cap.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-200/90 font-light leading-relaxed line-clamp-3">
                    {isUnlocked || isAuthor ? (
                      cap.body
                    ) : (
                      <span className="italic text-slate-400 flex items-center gap-2 font-light">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        This message is sealed until {release.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                      </span>
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-serif italic text-sm text-amber-300">
                    From: {isAuthor ? 'You 🌷' : (cap.authorName || partner.displayName) + ' ✨'}
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
                        className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-300/80 hover:text-rose-200 transition-colors"
                        title="Delete capsule"
                        aria-label={`Delete ${cap.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {capsules.length < 4 && (
            <div
              onClick={handleOpenCreate}
              className="group p-5 sm:p-6 rounded-2xl border border-dashed border-amber-400/25 hover:border-amber-300/50 bg-gradient-to-br from-amber-500/[0.04] to-transparent hover:bg-amber-500/[0.08] flex flex-col justify-center items-center text-center space-y-3 cursor-pointer transition-all duration-300 min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform shadow-inner">
                <Hourglass className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                  Seal a Future Letter
                </h4>
                <p className="text-xs text-amber-200/70 max-w-xs mx-auto leading-relaxed font-light">
                  Write a letter to unlock on a birthday, anniversary, or special future date...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-amber-200 border border-amber-300/20 group-hover:border-amber-300/40 group-hover:bg-amber-500/20 transition-all">
                <Plus className="w-3.5 h-3.5" /> Seal Envelope ⏳
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reader Modal */}
      {selectedCapsule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedCapsule(null)}
        >
          <div
            className="max-w-md w-full glass-parchment-card border border-amber-400/40 rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCapsule(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Time Capsule Unsealed</span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              {selectedCapsule.title}
            </h3>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/50 border border-amber-400/20 max-h-72 overflow-y-auto shadow-inner">
              <p className="font-serif italic text-base sm:text-lg text-amber-100/90 leading-relaxed whitespace-pre-line">
                “{selectedCapsule.body}”
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-3 border-t border-purple-400/15">
              <span>From: {selectedCapsule.authorId === currentUser.id ? 'You' : selectedCapsule.authorName || partner.displayName}</span>
              <span>Target: {new Date(selectedCapsule.releaseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
