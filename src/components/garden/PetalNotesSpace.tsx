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
  { color: '#f472b6', emoji: '🌸', name: 'Cherry Blossom' },
  { color: '#fb7185', emoji: '🌹', name: 'Velvet Rose' },
  { color: '#f59e0b', emoji: '🌼', name: 'Golden Daisy' },
  { color: '#a855f7', emoji: '🪻', name: 'Twilight Lavender' },
  { color: '#38bdf8', emoji: '🪷', name: 'Water Lily' },
  { color: '#34d399', emoji: '🌿', name: 'Fresh Fern' },
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
      alert(err?.message || 'Could not save note.');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Petal Notes</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Little Whispers, Compliments & Funny Thoughts
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Short, spontaneous notes that bloom when tapped. Private by default.
          </p>
        </div>

        <button
          onClick={handleOpenCompose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Leave a Petal Note</span>
        </button>
      </div>

      {/* Composing Note */}
      {isComposing && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Write a Petal Note
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
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Choose Flower Essence
              </label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedTheme(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                      selectedTheme.name === p.name
                        ? 'border-white bg-white/15 scale-105 shadow-md'
                        : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span className="text-slate-200">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Message Body
              </label>
              <textarea
                rows={3}
                required
                maxLength={240}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="A compliment, a funny thought, or a word of encouragement..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
              <span className="text-[10px] text-slate-500 font-mono float-right mt-1">
                {body.length}/240
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                {isShared ? <Globe2 className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                {isShared ? `Share with ${partner.displayName}` : 'Private to you'}
              </span>
              <button
                type="button"
                onClick={() => setIsShared(!isShared)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {isShared ? 'Shared ✨' : 'Make Shared'}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md"
              >
                Leave Petal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Petals */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Gathering petals...
        </div>
      ) : petals.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">No Custom Petal Notes Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Leave a spontaneous sweet note, funny observation, or encouragement for {partner.displayName}.
          </p>
          <button
            onClick={handleOpenCompose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Leave First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {petals.map((petal) => {
            const isMine = petal.authorId === currentUser.id;

            return (
              <div
                key={petal.id}
                onClick={() => handleViewPetal(petal)}
                className="group relative p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-pink-400/30 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md"
              >
                <div
                  className="absolute -top-2 -right-2 w-12 h-12 rounded-full opacity-20 blur-lg pointer-events-none"
                  style={{ backgroundColor: petal.color }}
                />

                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    {petal.emoji}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      petal.isShared
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                    }`}
                  >
                    {petal.isShared ? <Globe2 className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    <span>{petal.isShared ? 'Shared' : 'Private'}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-light line-clamp-3 leading-relaxed">
                  “{petal.body}”
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>From: {isMine ? 'You' : petal.authorName || partner.displayName}</span>
                  {isMine && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(petal);
                      }}
                      className="p-1 hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                      title="Delete petal"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Read Petal Dialog */}
      {activePetal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActivePetal(null)}
        >
          <div
            className="max-w-sm w-full bg-slate-900 border border-pink-400/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePetal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/20"
              style={{ backgroundColor: `${activePetal.color}25` }}
            >
              <span>{activePetal.emoji}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-light">
                “{activePetal.body}”
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-white/10">
              <span>From: {activePetal.authorId === currentUser.id ? 'You' : activePetal.authorName || partner.displayName}</span>
              <span>{new Date(activePetal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
