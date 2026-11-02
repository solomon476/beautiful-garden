import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  moodGardenService,
  authService,
  MOOD_OPTIONS,
} from '../../services/gardenService';
import type { MoodEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

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
      <div className="pb-6 border-b border-fuchsia-400/15 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-200 text-[10px] font-mono uppercase tracking-widest">
          <Heart className="w-3 h-3 text-fuchsia-400 fill-fuchsia-400/40" />
          <span>The Mood Garden</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
          Gentle Vibes & Daily Atmosphere
        </h3>
        <p className="text-xs sm:text-sm text-fuchsia-200/80 font-light leading-relaxed max-w-xl">
          Completely optional. Check in how you're feeling right now with no expectations, explanations, or pressure to respond.
        </p>
      </div>

      {/* Mood Selector Card */}
      <div className="glass-midnight-card p-6 sm:p-7 rounded-2xl space-y-5 relative overflow-hidden shadow-2xl border border-fuchsia-400/20">
        <div className="flex items-center justify-between pb-2 border-b border-fuchsia-400/15">
          <span className="text-xs font-mono uppercase text-fuchsia-200 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            How is your energy right now?
          </span>
        </div>

        <form onSubmit={handleSetMood} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
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
                  className={`p-3.5 sm:p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-fuchsia-500/25 to-purple-500/25 border-fuchsia-400/80 shadow-lg shadow-fuchsia-500/20 scale-[1.02] text-white font-medium'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-fuchsia-400/30'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">{m.emoji}</span>
                  <span className="text-xs tracking-wide">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="form-field-label">
              <span>Optional Thought or Note</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Taking it slow today with a cozy cup of tea..."
            />
          </div>

          {/* Decorated Privacy Switch */}
          <DecoratedPrivacyToggle
            isShared={isShared}
            onToggle={setIsShared}
            partnerName={partner.displayName}
            sharedTitle={`Share Energy with ${partner.displayName}`}
            sharedSubtitle={`Lets ${partner.displayName} know your mood so they can celebrate with you or offer comfort ✨`}
            privateTitle="Keep Mood Log Private"
            privateSubtitle="Recorded secretly for your personal mood reflection. Hidden from partner 🔒"
          />

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="btn-glow-romantic"
            >
              <span>Update Mood ✨</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recent Mood Stream */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-purple-300 uppercase tracking-wider">
          Recent Mood Check-ins
        </h4>

        {loading ? (
          <div className="py-6 text-center text-slate-400 text-xs font-mono animate-pulse">
            Checking moods...
          </div>
        ) : moods.length === 0 ? (
          <div className="glass-midnight-card p-6 rounded-2xl text-center text-xs text-slate-400 font-light border border-purple-400/15">
            No mood entries yet. Feel free to check in whenever you wish.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {moods.slice(0, 6).map((item) => {
              const isMine = item.userId === currentUser.id;

              return (
                <div
                  key={item.id}
                  className="glass-midnight-card p-4 rounded-xl border border-purple-400/20 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl filter drop-shadow">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-serif font-bold text-white">
                        {item.moodLabel}
                      </p>
                      {item.note && (
                        <p className="font-serif italic text-xs text-pink-200/90 leading-snug">
                          “{item.note}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                    <p className="text-purple-300 font-medium">{isMine ? 'You' : item.userName || partner.displayName}</p>
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
