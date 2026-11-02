import React, { useState, useEffect } from 'react';
import {
  Heart,
  Lock,
  Globe2,
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
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
          <Heart className="w-3.5 h-3.5" />
          <span>The Mood Garden</span>
        </div>
        <h3 className="font-serif text-2xl font-bold text-white">
          Gentle Vibes & Atmosphere
        </h3>
        <p className="text-xs text-slate-400 font-light mt-0.5 max-w-lg">
          Completely optional. Check in how you're feeling right now with no expectations, explanations, or pressure to respond.
        </p>
      </div>

      {/* Mood Selector Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4">
        <span className="text-xs font-mono uppercase text-pink-300">
          How is your energy right now?
        </span>

        <form onSubmit={handleSetMood} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-400 shadow-md scale-102 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Optional Note (Only if you feel like sharing)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Taking it slow today with some lo-fi..."
              className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded text-pink-500 focus:ring-0"
              />
              <span>
                {isShared ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" /> Visible to {partner.displayName}
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Private to you
                  </span>
                )}
              </span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md self-end transition-all"
            >
              Update Mood
            </button>
          </div>
        </form>
      </div>

      {/* Recent Mood Stream */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Recent Mood Check-ins
        </h4>

        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs font-mono animate-pulse">
            Checking moods...
          </div>
        ) : moods.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-slate-400">
            No mood entries yet. Feel free to set one whenever you want.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {moods.slice(0, 6).map((item) => {
              const isMine = item.userId === currentUser.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {item.moodLabel}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-slate-300 font-light italic">
                          “{item.note}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    <p>{isMine ? 'You' : item.userName || partner.displayName}</p>
                    <p className="text-slate-500">
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
