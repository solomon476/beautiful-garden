import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Globe2,
  Check,
  Clock,
  MessageSquare,
  Save,
} from 'lucide-react';
import {
  moodGardenService,
  authService,
} from '../../services/gardenService';
import type { MoodEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface MoodOptionConfig {
  key: string;
  label: string;
  subtitle: string;
  emoji: string;
  artUrl: string;
}

const ENHANCED_MOODS: MoodOptionConfig[] = [
  {
    key: 'peaceful',
    label: 'Peaceful',
    subtitle: 'Calm and content',
    emoji: '🌿',
    artUrl: '/assets/garden/moods/peaceful_art_clean.png',
  },
  {
    key: 'excited',
    label: 'Excited',
    subtitle: 'Full of energy',
    emoji: '✨',
    artUrl: '/assets/garden/moods/excited_art_clean.png',
  },
  {
    key: 'happy',
    label: 'Happy',
    subtitle: 'Grateful and joyful',
    emoji: '🌷',
    artUrl: '/assets/garden/moods/happy_art_clean.png',
  },
  {
    key: 'tired',
    label: 'Tired',
    subtitle: 'A bit drained',
    emoji: '🌙',
    artUrl: '/assets/garden/moods/tired_art_clean.png',
  },
  {
    key: 'listening',
    label: 'Looking for Music',
    subtitle: 'In the mood for tunes',
    emoji: '🎧',
    artUrl: '/assets/garden/moods/music_art_clean.png',
  },
  {
    key: 'thoughtful',
    label: 'Thoughtful',
    subtitle: 'Deep in thought',
    emoji: '☁️',
    artUrl: '/assets/garden/moods/thoughtful_art_clean.png',
  },
];

const DEFAULT_SAMPLE_MOODS: MoodEntry[] = [
  {
    id: 'sample-mood-excited',
    userId: 'user-solomon',
    userName: 'Solomon',
    moodKey: 'excited',
    moodLabel: 'Excited',
    emoji: '✨',
    note: 'Big plans ahead! 💕',
    isShared: false,
    createdAt: new Date('2026-11-03T16:35:00').toISOString(),
  },
];

const formatHistoryDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return dateStr;
  }
};

export const MoodGardenSection: React.FC = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('excited');
  const [note, setNote] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);

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
    if (isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await moodGardenService.setMood(selectedMoodKey, note, isShared);
      soundEngine.playChime(659.25, 1.0, 0.08);
      setNote('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3200);
      await loadMoods();
    } catch (err: any) {
      setSaveError(err?.message || 'Could not record check-in.');
    } finally {
      setIsSaving(false);
    }
  };

  // If no moods recorded yet, display the romantic sample entry matching the design
  const displayList = moods.length > 0 ? (showAllHistory ? moods : moods.slice(0, 5)) : DEFAULT_SAMPLE_MOODS;

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      {/* ================================================================= */}
      {/* 1. HERO BANNER: Magical Twilight Garden with Rustic Bench         */}
      {/* ================================================================= */}
      <div
        className="relative rounded-3xl overflow-hidden border border-purple-400/25 shadow-2xl p-6 sm:p-8 md:p-10 text-white min-h-[220px] sm:min-h-[260px] flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(13, 6, 28, 0.45) 0%, rgba(22, 9, 44, 0.6) 45%, rgba(13, 6, 28, 0.52) 100%), url(/assets/garden/hero_bench.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Subtle Ambient Sparkle / Glow Accents */}
        <div className="absolute top-4 left-1/4 w-3 h-3 text-pink-300/40 pointer-events-none animate-pulse">
          🌸
        </div>
        <div className="absolute bottom-6 right-1/3 w-3 h-3 text-pink-300/30 pointer-events-none animate-pulse">
          ✦
        </div>

        {/* Hero Title & Subtitle */}
        <div className="flex-1 text-center md:text-left space-y-1.5 select-none z-10">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white flex items-center justify-center md:justify-start gap-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            <span>Mood Garden</span>
            <span className="text-pink-300 text-2xl sm:text-3xl font-sans inline-block drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]">
              ♡
            </span>
          </h2>

          <p className="font-serif italic text-lg sm:text-2xl text-pink-100 font-normal tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            How are you feeling?
          </p>

          <p className="font-sans text-xs sm:text-sm text-purple-100/90 font-light max-w-lg leading-relaxed pt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            A little space to check in with yourself, whenever you feel like it. ♡
          </p>
        </div>

        {/* Right Floating Quote Card */}
        <div className="shrink-0 rounded-2xl bg-[#14072b]/65 backdrop-blur-md border border-purple-300/25 px-6 py-4 max-w-xs text-center shadow-[0_8px_32px_rgba(0,0,0,0.45)] z-10">
          <p className="font-serif italic text-sm text-pink-100 leading-snug">
            “Your feelings matter... here, always.”
          </p>
          <p className="text-xs text-pink-300/80 mt-1.5 font-sans font-light">
            — Perfect Time ♡
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. CHOOSE YOUR MOOD: 6 Illustrated Mood Cards + Check-In Note     */}
      {/* ================================================================= */}
      <div className="rounded-3xl border border-purple-400/25 bg-gradient-to-b from-[#240e3b]/85 via-[#19092c]/90 to-[#10061e]/95 backdrop-blur-xl p-5 sm:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.5)] space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-400/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-pink-300 text-lg shadow-inner">
              🪷
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide">
                Choose Your Mood
              </h3>
              <p className="text-xs text-purple-200/70 font-sans">
                Pick the mood that feels like you today.
              </p>
            </div>
          </div>
          <div className="text-xs text-pink-300/90 font-serif italic flex items-center gap-1.5 self-start sm:self-auto">
            <span>💖</span>
            <span>It's okay to feel however you feel. ♡</span>
          </div>
        </div>

        {/* 6 Mood Cards in 1 Row on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {ENHANCED_MOODS.map((card) => {
            const isSelected = selectedMoodKey === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setSelectedMoodKey(card.key);
                }}
                className={`group relative rounded-2xl overflow-hidden flex flex-col text-left transition-all duration-300 focus:outline-none cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-pink-400 shadow-[0_0_24px_rgba(236,72,153,0.65)] scale-[1.02] border-pink-400'
                    : 'border border-purple-400/20 hover:border-purple-300/50 hover:scale-[1.01]'
                }`}
                style={{
                  background: 'linear-gradient(180deg, #1f0d36 0%, #120622 100%)',
                }}
              >
                {/* Card Artwork */}
                <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-purple-950/60">
                  <img
                    src={card.artUrl}
                    alt={card.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#160829] via-transparent to-black/20" />

                  {/* Radio / Checkmark in Top Right */}
                  <div className="absolute top-2 right-2 z-10">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 border border-white flex items-center justify-center text-white shadow-md animate-fade-in">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/50 bg-black/30 backdrop-blur-sm transition-colors group-hover:border-white/80" />
                    )}
                  </div>
                </div>

                {/* Bottom Shelf */}
                <div
                  className={`p-2.5 sm:p-3 flex flex-col justify-center transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-900/80 to-[#1b0a30]'
                      : 'bg-[#150727]/90'
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-serif font-bold tracking-tight truncate ${
                      isSelected ? 'text-white' : 'text-slate-100 group-hover:text-pink-100'
                    }`}
                  >
                    {card.label}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-purple-200/70 font-sans font-light truncate mt-0.5">
                    {card.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Note & Save Row */}
        <form onSubmit={handleSetMood} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-2">
          {/* Left (8 cols): Note input & Privacy toggle */}
          <div className="lg:col-span-8 space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="mood-note-input"
                className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
                <span>Anything on your mind?</span>
              </label>

              {/* Privacy Pill Toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setIsShared(!isShared);
                }}
                className="text-[11px] font-sans px-2.5 py-1 rounded-full border border-purple-400/25 bg-white/[0.04] hover:bg-white/[0.08] text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Toggle privacy"
              >
                {isShared ? (
                  <>
                    <Globe2 className="w-3 h-3 text-pink-300" />
                    <span>Shared with {partner.displayName} 🌸</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-purple-300" />
                    <span>Private to you 🔒</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-purple-200/60 font-sans">
              Share a note about your mood (optional).
            </p>

            <div className="relative rounded-2xl overflow-hidden border border-purple-400/25 focus-within:border-pink-400 focus-within:ring-1 focus-within:ring-pink-400/40 transition-all bg-[#130722]/85 shadow-inner">
              <textarea
                id="mood-note-input"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. A great day, a busy mind, or just feeling quiet..."
                className="w-full p-3 sm:p-3.5 text-xs sm:text-sm font-serif leading-relaxed text-pink-50 placeholder-purple-300/40 bg-transparent resize-none outline-none"
              />
            </div>
          </div>

          {/* Right (4 cols): Save Button & Heart Flourish */}
          <div className="lg:col-span-4 flex flex-col items-center justify-end space-y-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 45%, #f97316 100%)',
              }}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving check-in...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save My Check-in →</span>
                </>
              )}
            </button>

            {/* Heart flourish matching screenshot */}
            <div className="w-24 h-5 flex items-center justify-center text-pink-300/80 select-none">
              <img
                src="/assets/garden/moods/heart_flourish_transparent.png"
                alt="heart flourish"
                className="h-full object-contain filter drop-shadow-[0_0_6px_rgba(244,114,182,0.4)]"
              />
            </div>
          </div>
        </form>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="rounded-xl px-4 py-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Your mood check-in has been quietly recorded in Our Garden. 🌿</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-xl px-4 py-2 bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 3. A LITTLE HISTORY: Past Mood Reflections                        */}
      {/* ================================================================= */}
      <div className="rounded-3xl border border-purple-400/20 bg-gradient-to-r from-[#210d38]/80 via-[#18092a]/80 to-[#120622]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                A Little History
              </h3>
              <p className="text-[11px] text-purple-200/60 font-sans">
                A glimpse of your past moods.
              </p>
            </div>
          </div>

          {moods.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="px-3.5 py-1.5 rounded-full border border-purple-400/30 bg-white/[0.05] hover:bg-white/[0.1] text-xs text-purple-200 font-medium transition-all cursor-pointer"
            >
              {showAllHistory ? 'Show Recent' : 'View All →'}
            </button>
          )}
        </div>

        {/* History Entries */}
        <div className="space-y-2.5">
          {displayList.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-3.5 sm:p-4 border border-purple-400/15 bg-white/[0.04] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm transition-all hover:border-purple-300/30"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-base select-none">{item.emoji}</span>
                <span className="font-serif font-bold text-white">{item.moodLabel}</span>
                <span className="text-purple-400/40 select-none">|</span>
                <span className="text-purple-200/70 font-mono text-xs">
                  {formatHistoryDate(item.createdAt)}
                </span>
                {item.note && (
                  <>
                    <span className="text-purple-400/40 select-none hidden sm:inline">|</span>
                    <span className="font-serif italic text-pink-200 text-xs sm:text-sm">
                      “{item.note}”
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                    item.isShared
                      ? 'bg-pink-500/15 border-pink-400/35 text-pink-300'
                      : 'bg-purple-500/15 border-purple-400/30 text-purple-300'
                  }`}
                >
                  {item.isShared ? (
                    <>
                      <Globe2 className="w-2.5 h-2.5 text-pink-300" />
                      <span>Shared 🌸</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-2.5 h-2.5 text-purple-300" />
                      <span>Private 🔒</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
