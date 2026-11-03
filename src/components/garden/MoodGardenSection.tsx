import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Sparkles,
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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

export const MoodGardenSection: React.FC = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('peaceful');
  const [note, setNote] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  const formRef = useRef<HTMLDivElement>(null);
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

  const handleScrollToForm = () => {
    soundEngine.playSparkle();
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup Format */}
      <section
        className="relative rounded-3xl overflow-hidden border border-fuchsia-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(42, 14, 44, 0.94) 0%, rgba(20, 8, 24, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_petals.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(232, 121, 249, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%)',
          }}
        />

        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-fuchsia-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/card_petals.jpg"
                alt="The Mood Garden"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="w-8 h-8 text-fuchsia-300 fill-fuchsia-400/40 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ The Mood Garden</span>
                <span className="text-fuchsia-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Mood Garden</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-fuchsia-200/90 max-w-xl leading-relaxed">
                Gentle vibes, emotional presence, and quiet check-ins with zero pressure.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-fuchsia-300/70 pt-1">
                Feel • Reflect • Share • Understand
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleScrollToForm}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Check In Energy</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Mood Selector Card */}
      <div
        ref={formRef}
        className="rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl border border-fuchsia-400/30"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 14, 44, 0.7) 0%, rgba(18, 7, 24, 0.85) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-fuchsia-400/20">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-fuchsia-200 tracking-wider font-semibold">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>How is your energy right now?</span>
          </div>
          <span className="text-[11px] font-mono text-fuchsia-300/70">
            🌸 Optional daily check-in
          </span>
        </div>

        <form onSubmit={handleSetMood} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-fuchsia-500/30 to-pink-500/30 border-fuchsia-300 shadow-lg shadow-fuchsia-500/25 scale-[1.03] text-white font-medium'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-fuchsia-400/40 hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-3xl filter drop-shadow">{m.emoji}</span>
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
              className="w-full"
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
              className="btn-glow-romantic text-xs sm:text-sm py-3 px-6 shadow-xl"
            >
              <span>Update Mood ✨</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Recent Mood Check-ins — 2 Column Responsive Glass Cards matching Mockup */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-300 uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Recent Mood Check-ins</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-fuchsia-300/60 text-xs font-mono animate-pulse">
            Tuning in to garden moods...
          </div>
        ) : moods.length === 0 ? (
          <div className="glass-midnight-card p-8 rounded-3xl text-center text-xs text-fuchsia-200/70 font-light border border-fuchsia-400/20">
            No mood entries yet. Feel free to check in whenever you wish.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {moods.slice(0, 8).map((item) => {
              const isMine = item.userId === currentUser.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl p-5 border border-fuchsia-400/25 flex items-center justify-between gap-4 shadow-lg transition-all hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(36, 14, 40, 0.65) 0%, rgba(18, 7, 24, 0.8) 100%)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-3xl filter drop-shadow shrink-0">{item.emoji}</span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-serif font-bold text-white truncate">
                          {item.moodLabel}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                            item.isShared
                              ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                              : 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                          }`}
                        >
                          {item.isShared ? <Globe2 className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-purple-300" />}
                          <span>{item.isShared ? 'Shared' : 'Private'}</span>
                        </span>
                      </div>
                      {item.note && (
                        <p className="font-serif italic text-xs text-pink-200/90 leading-snug line-clamp-2">
                          “{item.note}” <span className="font-sans not-italic text-pink-300">♡</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono shrink-0 space-y-0.5">
                    <p className="text-pink-300 font-medium">
                      By: {isMine ? 'You' : item.userName || partner.displayName}
                    </p>
                    <p className="text-fuchsia-300/60 text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
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
