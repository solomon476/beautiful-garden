import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Globe2,
  X,
} from 'lucide-react';
import { petalNotesService, authService } from '../../services/gardenService';
import type { PetalNoteEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

const PALETTE = [
  { color: '#f472b6', bgGradient: 'from-pink-500/25 via-rose-500/15 to-transparent', emoji: '🌸', name: 'Cherry Blossom' },
  { color: '#fb7185', bgGradient: 'from-rose-500/25 via-red-500/15 to-transparent', emoji: '🌹', name: 'Velvet Rose' },
  { color: '#f59e0b', bgGradient: 'from-amber-500/25 via-yellow-500/15 to-transparent', emoji: '🌼', name: 'Golden Daisy' },
  { color: '#c084fc', bgGradient: 'from-purple-500/25 via-fuchsia-500/15 to-transparent', emoji: '🪻', name: 'Twilight Lavender' },
  { color: '#38bdf8', bgGradient: 'from-sky-500/25 via-cyan-500/15 to-transparent', emoji: '🪷', name: 'Water Lily' },
  { color: '#34d399', bgGradient: 'from-emerald-500/25 via-teal-500/15 to-transparent', emoji: '🌿', name: 'Fresh Fern' },
];

export const PetalNotesSpace: React.FC = () => {
  const [petals, setPetals] = useState<PetalNoteEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form state
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [body, setBody] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState(PALETTE[0]);
  const [isShared, setIsShared] = useState<boolean>(false); // Private by default
  const [activePetal, setActivePetal] = useState<PetalNoteEntry | null>(null);

  const partner = authService.getPartner();

  const loadPetals = async () => {
    try {
      setLoading(true);
      const list = await petalNotesService.getPetals();
      setPetals(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPetals();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadPetals();
    });
    return unsubscribe;
  }, []);

  const handleOpenCompose = () => {
    soundEngine.playSparkle();
    setBody('');
    setSelectedTheme(PALETTE[0]);
    setIsShared(false);
    setIsComposing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      await petalNotesService.addPetal({
        body,
        color: selectedTheme.color,
        emoji: selectedTheme.emoji,
        isShared,
      });

      soundEngine.playChime(659.25, 1.0, 0.08);
      setIsComposing(false);
      await loadPetals();
    } catch (err: any) {
      alert(err?.message || 'Could not save petal note.');
    }
  };

  const handleDelete = async (p: PetalNoteEntry) => {
    if (p.authorId !== currentUser.id) return;
    if (window.confirm('Delete this petal note?')) {
      await petalNotesService.deletePetal(p.id);
      if (activePetal?.id === p.id) setActivePetal(null);
      await loadPetals();
    }
  };

  const handleViewPetal = (p: PetalNoteEntry) => {
    soundEngine.playSparkle();
    setActivePetal(p);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-rose-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-200 text-[10px] font-mono uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-rose-300" />
            <span>Interactive Petal Notes</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Little Whispers, Compliments & Flower Messages
          </h3>
          <p className="text-xs sm:text-sm text-rose-200/80 font-light leading-relaxed max-w-xl">
            Spontaneous notes that unfurl like fresh petals when opened. Private by default.
          </p>
        </div>

        <button
          onClick={handleOpenCompose}
          className="btn-glow-romantic self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Leave a Petal Note</span>
        </button>
      </div>

      {/* Composing Note */}
      {isComposing && (
        <div className="glass-midnight-card p-6 sm:p-7 rounded-2xl space-y-4 animate-fade-in relative overflow-hidden border border-rose-400/30 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-rose-400/15">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-200 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              Craft a Flower Note
            </span>
            <button
              onClick={() => setIsComposing(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-pink-200/70 uppercase tracking-wider mb-2">
                Choose Floral Essence
              </label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedTheme(p)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                      selectedTheme.name === p.name
                        ? 'border-pink-300 bg-pink-500/25 shadow-sm text-white font-medium'
                        : 'border-white/10 bg-white/[0.04] text-purple-200/70 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                Petal Whisper (Up to 240 characters)
              </label>
              <textarea
                rows={3}
                required
                maxLength={240}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="A compliment, a teasing observation, or a warm thought for the day..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c26]/80 border border-purple-400/25 text-white text-sm focus:outline-none focus:border-pink-400 transition-colors placeholder:text-pink-300/30 shadow-inner resize-y font-light leading-relaxed"
              />
              <span className="text-[10px] text-purple-300/50 font-mono float-right mt-1">
                {body.length}/240
              </span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-400/20 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-light flex items-center gap-1.5">
                {isShared ? <Globe2 className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                {isShared ? `Share with ${partner.displayName}` : 'Private to you'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 shadow-sm'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? 'Shared ✨' : 'Make Shared 💌'}
              </button>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-rose-400/15">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-glow-romantic text-xs"
              >
                Bloom Petal Note 🌸
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Petals */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Gathering flower blossoms...
        </div>
      ) : petals.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-2xl text-center space-y-3.5 border border-rose-400/25">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl text-white">No Added Petal Notes Yet</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            Leave a spontaneous sweet note, funny observation, or encouragement for {partner.displayName}.
          </p>
          <button
            onClick={handleOpenCompose}
            className="btn-glow-romantic text-xs mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Leave First Note 🌸</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {petals.map((petal) => {
            const isMine = petal.authorId === currentUser.id;

            return (
              <div
                key={petal.id}
                onClick={() => handleViewPetal(petal)}
                className="glass-midnight-card group p-5 sm:p-6 rounded-2xl hover:border-pink-400/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden min-h-[200px]"
              >
                {/* Glow Aura */}
                <div
                  className="absolute -top-3 -right-3 w-24 h-24 rounded-full opacity-25 blur-xl pointer-events-none"
                  style={{ backgroundColor: petal.color }}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-11 h-11 rounded-xl border flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: `${petal.color}20`, borderColor: `${petal.color}40` }}
                    >
                      <span>{petal.emoji}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono border shadow-sm ${
                        petal.isShared
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                          : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      }`}
                    >
                      {petal.isShared ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{petal.isShared ? 'Shared 💌' : 'Private 🔒'}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-purple-100/90 font-light line-clamp-3 leading-relaxed">
                    “{petal.body}”
                  </p>
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between text-xs">
                  <span className="font-handwriting text-xl text-pink-300 font-medium truncate">
                    From: {isMine ? 'You 🌸' : (petal.authorName || partner.displayName) + ' ✨'}
                  </span>
                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(petal);
                      }}
                      className="p-1.5 rounded-full hover:bg-rose-500/20 text-purple-300/70 hover:text-rose-300 transition-colors"
                      title="Delete petal"
                      aria-label="Delete petal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {petals.length < 4 && (
            <div
              onClick={handleOpenCompose}
              className="group p-5 sm:p-6 rounded-2xl border border-dashed border-rose-400/25 hover:border-rose-300/50 bg-gradient-to-br from-rose-500/[0.04] to-transparent hover:bg-rose-500/[0.08] flex flex-col justify-center items-center text-center space-y-3 cursor-pointer transition-all duration-300 min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-white group-hover:text-pink-200 transition-colors">
                  Plant a New Petal
                </h4>
                <p className="text-xs text-rose-200/70 max-w-xs mx-auto leading-relaxed font-light">
                  Leave a spontaneous whisper, flower note, or sweet thought...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-rose-200 border border-rose-300/20 group-hover:border-rose-300/40 group-hover:bg-rose-500/20 transition-all">
                <Plus className="w-3.5 h-3.5" /> Plant Petal 🌸
              </span>
            </div>
          )}
        </div>
      )}

      {/* Read Petal Dialog */}
      {activePetal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setActivePetal(null)}
        >
          <div
            className="max-w-sm w-full glass-midnight-card border border-pink-400/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePetal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-18 h-18 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-xl border border-white/25 animate-bounce"
              style={{ backgroundColor: `${activePetal.color}30` }}
            >
              <span>{activePetal.emoji}</span>
            </div>

            <div className="p-5 rounded-2xl bg-black/30 border border-purple-400/20 shadow-inner">
              <p className="font-handwriting text-2xl text-pink-100 leading-relaxed">
                “{activePetal.body}”
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-purple-400/15">
              <span>From: {activePetal.authorId === currentUser.id ? 'You' : activePetal.authorName || partner.displayName}</span>
              <span>{new Date(activePetal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
