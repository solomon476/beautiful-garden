import React, { useState, useEffect } from 'react';
import {
  Heart,
  Lock,
  Globe2,
  Sparkles,
} from 'lucide-react';
import {
  moodGardenService,
  authService,
  MOOD_OPTIONS,
} from '../../services/gardenService';
import type { MoodEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

export const MoodGardenSection: React.FC = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('peaceful');
  const [note, setNote] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  const partner = authService.getPartner();

  const loadMoods = async () => {
    try {
      setLoading(true);
      const list = await moodGardenService.getMoods();
      setMoods(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoods();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadMoods();
    });
    return unsubscribe;
  }, []);

  const handleSetMood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await moodGardenService.setMood(selectedMoodKey, note, isShared);
      soundEngine.playChime(659.25, 1.0, 0.08);
      setNote('');
      await loadMoods();
    } catch (err: any) {
      alert(err?.message || 'Could not record mood.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-purple-400/15">
        <div className="flex items-center gap-2 text-fuchsia-300 text-xs font-mono uppercase tracking-wider mb-1">
          <Heart className="w-3.5 h-3.5 text-fuchsia-400 fill-fuchsia-400/40" />
          <span>The Mood Garden</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Gentle Vibes & Daily Atmosphere
        </h3>
        <p className="font-handwriting text-lg text-fuchsia-200/80 mt-0.5 max-w-lg">
          Completely optional. Check in how you're feeling right now with no expectations, explanations, or pressure to respond.
        </p>
      </div>

      {/* Mood Selector Card */}
      <div className="glass-midnight-card p-6 sm:p-8 rounded-3xl space-y-5 relative overflow-hidden shadow-xl">
        <span className="text-xs font-mono uppercase text-fuchsia-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          How is your energy right now?
        </span>

        <form onSubmit={handleSetMood} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOOD_OPTIONS.map((m) => {
              const isSelected = selectedMoodKey === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setSelectedMoodKey(m.key);
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-fuchsia-500/30 to-purple-500/30 border-fuchsia-400 shadow-lg shadow-fuchsia-500/25 scale-103 text-white font-semibold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-purple-400/30'
                  }`}
                >
                  <span className="text-3xl filter drop-shadow">{m.emoji}</span>
                  <span className="text-xs tracking-wide">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-mono text-fuchsia-200/70 uppercase tracking-wider mb-1">
              Optional Note (Only if you feel like sharing)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Taking it slow today with a cozy cup of tea..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-purple-400/20 text-white text-sm focus:outline-none focus:border-fuchsia-400 shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded text-fuchsia-500 focus:ring-0"
              />
              <span>
                {isShared ? (
                  <span className="text-emerald-300 flex items-center gap-1 font-medium">
                    <Globe2 className="w-3.5 h-3.5" /> Visible to {partner.displayName}
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1 font-medium">
                    <Lock className="w-3.5 h-3.5" /> Private to you
                  </span>
                )}
              </span>
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-fuchsia-500/25 border border-white/20 self-end transition-all"
            >
              Update Mood ✨
            </button>
          </div>
        </form>
      </div>

      {/* Recent Mood Stream */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-mono text-purple-300 uppercase tracking-wider">
          Recent Mood Check-ins
        </h4>

        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs font-mono animate-pulse">
            Checking moods...
          </div>
        ) : moods.length === 0 ? (
          <div className="glass-midnight-card p-6 rounded-2xl text-center text-xs text-slate-400 font-light">
            No mood entries yet. Feel free to check in whenever you wish.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {moods.slice(0, 6).map((item) => {
              const isMine = item.userId === currentUser.id;

              return (
                <div
                  key={item.id}
                  className="glass-midnight-card p-4 sm:p-5 rounded-2xl border border-purple-400/20 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl filter drop-shadow">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-serif font-bold text-white">
                        {item.moodLabel}
                      </p>
                      {item.note && (
                        <p className="font-handwriting text-base text-pink-200 leading-snug">
                          “{item.note}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <p className="text-purple-300">{isMine ? 'You' : item.userName || partner.displayName}</p>
                    <p className="text-slate-500 text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
