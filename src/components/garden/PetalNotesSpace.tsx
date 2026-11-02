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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-rose-400/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-400/40 text-rose-200 text-xs font-mono uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Interactive Petal Notes</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient-garden">
            Little Whispers, Compliments & Flower Messages
          </h3>
          <p className="font-handwriting text-2xl text-rose-200/90 leading-relaxed max-w-xl">
            Spontaneous notes that unfurl like fresh petals when opened. Private by default.
          </p>
        </div>

        <button
          onClick={handleOpenCompose}
          className="btn-glow-romantic self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Leave a Petal Note</span>
        </button>
      </div>

      {/* Composing Note */}
      {isComposing && (
        <div className="glass-midnight-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Craft a Flower Note
            </span>
            <button
              onClick={() => setIsComposing(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-2">
                Choose Floral Essence
              </label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedTheme(p)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs border transition-all ${
                      selectedTheme.name === p.name
                        ? 'border-pink-300 bg-pink-500/30 scale-105 shadow-md shadow-pink-500/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100 text-slate-200'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
                Petal Whisper (Up to 240 characters)
              </label>
              <textarea
                rows={3}
                required
                maxLength={240}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="A compliment, a teasing observation, or a warm thought for the day..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner resize-y font-light leading-relaxed"
              />
              <span className="text-[10px] text-slate-500 font-mono float-right mt-1">
                {body.length}/240
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-400/25 flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                {isShared ? <Globe2 className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                {isShared ? `Share with ${partner.displayName}` : 'Private to you'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 shadow-sm'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? 'Shared ✨' : 'Make Shared 💌'}
              </button>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 border border-white/20"
              >
                Bloom Petal Note 🌸
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Petals */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Gathering flower blossoms...
        </div>
      ) : petals.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl text-white">No Added Petal Notes Yet</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Leave a spontaneous sweet note, funny observation, or encouragement for {partner.displayName}.
          </p>
          <button
            onClick={handleOpenCompose}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 text-rose-200 text-xs font-medium border border-rose-400/30 transition-all hover:scale-105"
          >
            Leave First Note 🌸
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {petals.map((petal) => {
            const isMine = petal.authorId === currentUser.id;

            return (
              <div
                key={petal.id}
                onClick={() => handleViewPetal(petal)}
                className="glass-midnight-card group p-7 sm:p-8 rounded-[2rem] hover:border-pink-400/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden min-h-[220px]"
              >
                {/* Glow Aura */}
                <div
                  className="absolute -top-3 -right-3 w-28 h-28 rounded-full opacity-35 blur-xl pointer-events-none"
                  style={{ backgroundColor: petal.color }}
                />

                <div className="flex items-start justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${petal.color}20`, borderColor: `${petal.color}40` }}
                  >
                    <span>{petal.emoji}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono border shadow-sm ${
                      petal.isShared
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                        : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                    }`}
                  >
                    {petal.isShared ? <Globe2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{petal.isShared ? 'Shared 💌' : 'Private 🔒'}</span>
                  </span>
                </div>

                <p className="text-sm text-slate-100 font-light line-clamp-3 leading-relaxed">
                  “{petal.body}”
                </p>

                <div className="pt-4 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-handwriting text-2xl text-pink-300 font-medium">
                    From: {isMine ? 'You 🌸' : (petal.authorName || partner.displayName) + ' ✨'}
                  </span>
                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(petal);
                      }}
                      className="p-2 rounded-full hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 transition-colors"
                      title="Delete petal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {petals.length < 3 && (
            <div
              onClick={handleOpenCompose}
              className="group p-7 sm:p-8 rounded-[2rem] border-2 border-dashed border-rose-400/30 hover:border-rose-300/60 bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-transparent flex flex-col justify-center items-center text-center space-y-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-rose-500/10 min-h-[220px] shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform shadow-inner">
                <Sparkles className="w-6 h-6 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                  Plant a New Petal
                </h4>
                <p className="font-handwriting text-xl text-rose-200/80 max-w-xs mx-auto leading-snug">
                  Leave a spontaneous whisper, flower note, or sweet thought...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-rose-200 border border-rose-300/30 group-hover:bg-rose-500/30 transition-all">
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
