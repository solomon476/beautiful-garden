import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Globe2,
  Clock,
  Heart,
  BarChart3,
  PenLine,
  X,
  ChevronDown,
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
    key: 'happy',
    label: 'Happy',
    subtitle: 'Grateful and joyful',
    emoji: '😊',
    artUrl: '/assets/garden/moods/fluent/happy.png',
  },
  {
    key: 'in_love',
    label: 'In Love',
    subtitle: 'Thinking of you ♡',
    emoji: '😍',
    artUrl: '/assets/garden/moods/fluent/in_love.png',
  },
  {
    key: 'calm',
    label: 'Calm',
    subtitle: 'Peaceful and relaxed',
    emoji: '😌',
    artUrl: '/assets/garden/moods/fluent/calm.png',
  },
  {
    key: 'sad',
    label: 'Sad',
    subtitle: 'A little down today',
    emoji: '🥺',
    artUrl: '/assets/garden/moods/fluent/sad.png',
  },
  {
    key: 'thoughtful',
    label: 'Thoughtful',
    subtitle: 'Thinking deeply',
    emoji: '🤔',
    artUrl: '/assets/garden/moods/fluent/thoughtful.png',
  },
  {
    key: 'excited',
    label: 'Excited',
    subtitle: 'Looking forward!',
    emoji: '🤩',
    artUrl: '/assets/garden/moods/fluent/excited.png',
  },
];

const DEFAULT_SAMPLE_MOODS: MoodEntry[] = [
  {
    id: 'sample-mood-excited',
    userId: 'user-solomon',
    userName: 'Solomon',
    moodKey: 'excited',
    moodLabel: 'Excited',
    emoji: '🤩',
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
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('happy');
  const [note, setNote] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

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
      setTimeout(() => setSaveSuccess(false), 3500);
      await loadMoods();
    } catch (err: any) {
      setSaveError(err?.message || 'Could not record check-in.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayList = moods.length > 0 ? moods : DEFAULT_SAMPLE_MOODS;

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-16 font-sans select-none">
      {/* ================================================================= */}
      {/* 1. HERO BANNER: Twilight Sunset Clouds with Blooming Flowers     */}
      {/* ================================================================= */}
      <div
        className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-400/30 shadow-2xl p-6 sm:p-8 md:p-10 text-white min-h-[190px] sm:min-h-[220px] flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(20, 8, 38, 0.45) 0%, rgba(20, 8, 38, 0.25) 50%, rgba(20, 8, 38, 0.55) 100%), url(/assets/garden/mood_twilight_sunset_bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
        }}
      >
        {/* Left Side: Calligraphy Script Title & Romantic Subtitle */}
        <div className="flex-1 text-center md:text-left space-y-2 z-10">
          <h1 className="font-script text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-wide flex items-center justify-center md:justify-start gap-2.5 drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]">
            <span>Mood Garden</span>
            <span className="text-pink-300 font-script text-3xl sm:text-4xl drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]">
              ♡
            </span>
          </h1>

          <div className="space-y-1">
            <p className="font-serif italic text-sm sm:text-base md:text-lg text-pink-100 font-light leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Express what you feel...
            </p>
            <p className="font-serif italic text-sm sm:text-base md:text-lg text-pink-100 font-light leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Let our garden know your mood today.
            </p>
          </div>

          {/* Underline Heart Swirl Flourish matching screenshot */}
          <div className="pt-0.5 flex justify-center md:justify-start">
            <img
              src="/assets/garden/moods/heart_flourish_transparent.png"
              alt="Heart Flourish"
              className="w-32 sm:w-40 h-auto opacity-95 filter drop-shadow-[0_0_8px_rgba(244,114,182,0.7)]"
            />
          </div>
        </div>

        {/* Right Side: Frosted Glass Keepsake Quote Card */}
        <div className="shrink-0 rounded-2xl sm:rounded-3xl bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/25 px-5 sm:px-7 py-4 sm:py-5 max-w-xs text-center shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition-all z-10">
          <p className="font-serif italic text-xs sm:text-sm md:text-base text-pink-50 leading-relaxed drop-shadow-sm">
            “A happy heart makes a beautiful garden.”
          </p>
          <div className="pt-2 text-pink-300 font-script text-xl drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]">
            ♡
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. MAIN CARD: "🌸 How are you feeling today?"                     */}
      {/* ================================================================= */}
      <div className="relative rounded-3xl sm:rounded-[2.5rem] border border-pink-500/30 bg-gradient-to-b from-[#240e3f]/95 via-[#1a0830]/95 to-[#110521]/98 backdrop-blur-2xl p-5 sm:p-8 md:p-10 shadow-[0_12px_45px_rgba(0,0,0,0.65),0_0_40px_rgba(236,72,153,0.18)] space-y-6 sm:space-y-8 overflow-hidden">
        {/* Subtle Background Glow behind Card */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="space-y-1 relative z-10 text-left">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-wide flex items-center gap-2 drop-shadow-sm">
            <span>🌸</span>
            <span>How are you feeling today?</span>
          </h2>
          <p className="font-serif italic text-xs sm:text-sm text-pink-200/90 font-light">
            Choose a mood that best describes your heart right now...
          </p>
        </div>

        {/* 6 Glowing Pastel Pill Capsules (3 columns x 2 rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
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
                className={`group relative rounded-full py-3 sm:py-3.5 px-4 sm:px-5 flex items-center justify-between gap-3 text-left transition-all duration-300 focus:outline-none cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#ffeef7] via-[#f7e6f8] to-[#eee5fa] border-2 border-pink-400 ring-2 ring-pink-400/80 shadow-[0_0_24px_rgba(236,72,153,0.7)] scale-[1.02]'
                    : 'bg-gradient-to-r from-[#fae8f3] via-[#f5e5f5] to-[#ece5f8] hover:from-[#fff0f8] hover:to-[#f3eaff] border border-white/70 shadow-md hover:scale-[1.01] hover:shadow-lg'
                }`}
              >
                {/* Left: 3D High-Res Fluent Emoji */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center">
                  <img
                    src={card.artUrl}
                    alt={card.label}
                    className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Center: Title & Subtitle */}
                <div className="flex-1 min-w-0 pl-1">
                  <span className="block font-serif font-bold text-[#2d1045] text-base sm:text-lg leading-tight truncate">
                    {card.label}
                  </span>
                  <span className="block font-serif italic text-[#723e7e] text-xs sm:text-sm leading-tight truncate mt-0.5">
                    {card.subtitle}
                  </span>
                </div>

                {/* Right: Radio Selection Circle */}
                <div className="shrink-0 pl-1">
                  {isSelected ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-pink-500 bg-pink-500 flex items-center justify-center text-white shadow-sm shadow-pink-500/50">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#b59ecb] bg-white/70 group-hover:border-purple-500 transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Note Input Section */}
        <form onSubmit={handleSetMood} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="mood-note-input"
                className="text-xs sm:text-sm font-serif font-medium text-pink-100 flex items-center gap-2"
              >
                <PenLine className="w-4 h-4 text-pink-300" />
                <span>Add a little note (optional)</span>
              </label>

              {/* Privacy Pill Toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setIsShared(!isShared);
                }}
                className="text-[11px] font-sans px-3 py-1 rounded-full border border-purple-400/30 bg-white/[0.06] hover:bg-white/[0.12] text-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
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

            {/* Glowing Textarea Container */}
            <div className="relative rounded-2xl border border-purple-400/30 bg-[#160829]/90 focus-within:border-pink-400/70 focus-within:ring-2 focus-within:ring-pink-500/20 shadow-inner transition-all">
              <textarea
                id="mood-note-input"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Share what's on your mind..."
                className="w-full p-3.5 sm:p-4 text-xs sm:text-sm font-serif leading-relaxed text-pink-50 placeholder-purple-300/40 bg-transparent resize-none outline-none pb-7"
              />
              <span className="absolute bottom-2.5 right-4 text-[10px] sm:text-xs font-mono text-purple-300/60 pointer-events-none select-none">
                {note.length}/500
              </span>
            </div>
          </div>

          {/* Action Row: Left History Pill, Right Glowing Save Pill */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setShowHistoryModal(!showHistoryModal);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-purple-400/35 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-pink-300" />
              <span>View My Mood History</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-purple-300 transition-transform ${
                  showHistoryModal ? 'rotate-180' : ''
                }`}
              />
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 rounded-full text-white font-semibold text-xs sm:text-sm shadow-[0_0_28px_rgba(236,72,153,0.65)] hover:shadow-[0_0_35px_rgba(244,63,94,0.85)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/30 cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 45%, #f97316 100%)',
              }}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Mood...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 text-white fill-white" />
                  <span>Save My Mood</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback Alerts */}
          {saveSuccess && (
            <div className="rounded-2xl px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Your mood has been recorded in Our Garden. 🌿</span>
            </div>
          )}
          {saveError && (
            <div className="rounded-2xl px-4 py-2.5 bg-rose-500/20 border border-rose-400/35 text-rose-200 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
              <span>{saveError}</span>
            </div>
          )}
        </form>

        {/* Framing Corner Blossoms from Mockup */}
        <span className="absolute bottom-2 left-3 text-3xl select-none pointer-events-none opacity-80 filter drop-shadow">
          🌸
        </span>
        <span className="absolute bottom-2 right-3 text-3xl select-none pointer-events-none opacity-80 filter drop-shadow">
          🌸
        </span>
      </div>

      {/* ================================================================= */}
      {/* 3. MOOD HISTORY DRAWER / VIEW (Deep Midnight Plum Glass)           */}
      {/* ================================================================= */}
      {showHistoryModal && (
        <div className="rounded-3xl sm:rounded-[2rem] border border-purple-400/25 bg-gradient-to-b from-[#210c3a]/95 via-[#18082c]/95 to-[#110521]/98 backdrop-blur-2xl p-5 sm:p-7 shadow-2xl space-y-4 animate-fade-in relative z-10">
          <div className="flex items-center justify-between border-b border-purple-400/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                  Mood History
                </h3>
                <p className="text-[11px] sm:text-xs text-purple-200/70 font-sans">
                  A gentle timeline of what you have shared in the garden.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-purple-300 hover:text-white transition-colors cursor-pointer"
              title="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {displayList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl p-3 sm:p-4 border border-purple-400/15 bg-white/[0.04] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm transition-all hover:border-purple-300/30"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xl select-none">{item.emoji}</span>
                  <span className="font-serif font-bold text-white">{item.moodLabel}</span>
                  <span className="text-purple-400/40 select-none">|</span>
                  <span className="text-purple-200/70 font-mono text-[11px]">
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
      )}
    </div>
  );
};
