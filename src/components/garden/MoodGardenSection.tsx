import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Globe2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import {
  moodGardenService,
  authService,
} from '../../services/gardenService';
import type { MoodEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface MoodCardItem {
  key: string;
  label: string;
  emoji: string;
  iconBg: string;
  hoverBorder: string;
}

const MOOD_CARDS: MoodCardItem[] = [
  {
    key: 'peaceful',
    label: 'Peaceful',
    emoji: '🌿',
    iconBg: 'rgba(52, 211, 153, 0.14)',
    hoverBorder: 'hover:border-emerald-300/40',
  },
  {
    key: 'excited',
    label: 'Excited',
    emoji: '✨',
    iconBg: 'rgba(251, 191, 36, 0.14)',
    hoverBorder: 'hover:border-amber-300/40',
  },
  {
    key: 'happy',
    label: 'Happy',
    emoji: '🌷',
    iconBg: 'rgba(244, 114, 182, 0.14)',
    hoverBorder: 'hover:border-pink-300/40',
  },
  {
    key: 'tired',
    label: 'Tired',
    emoji: '🌙',
    iconBg: 'rgba(167, 139, 250, 0.14)',
    hoverBorder: 'hover:border-purple-300/40',
  },
  {
    key: 'listening',
    label: 'Looking for Music',
    emoji: '🎧',
    iconBg: 'rgba(129, 140, 248, 0.14)',
    hoverBorder: 'hover:border-indigo-300/40',
  },
  {
    key: 'thoughtful',
    label: 'Thoughtful',
    emoji: '☁️',
    iconBg: 'rgba(147, 197, 253, 0.14)',
    hoverBorder: 'hover:border-sky-300/40',
  },
];

export const MoodGardenSection: React.FC = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('peaceful');
  const [note, setNote] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl sm:max-w-3xl mx-auto w-full space-y-6 sm:space-y-7 animate-fade-in pb-12 font-sans">
      {/* ================================================================= */}
      {/* SECTION A: Elegant, Compact Header                                 */}
      {/* ================================================================= */}
      <header className="text-center pt-1 pb-1 space-y-2 select-none">
        {/* Subtle Feature Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-200 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase">
          <span className="text-pink-300">🌿</span>
          <span>MOOD GARDEN</span>
          <span className="text-pink-300">✦</span>
        </div>

        {/* Main Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-medium tracking-tight mt-1 flex items-center justify-center gap-2">
          <span>How are you feeling?</span>
        </h2>

        {/* Subtitle */}
        <p className="font-sans text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto leading-relaxed font-light">
          A little space to check in with yourself, whenever you feel like it.
        </p>

        {/* Subtle Botanical Accent Flourish */}
        <div className="flex items-center justify-center gap-2 pt-1 text-purple-300/35">
          <svg className="w-12 h-1.5 opacity-60" viewBox="0 0 48 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 3C12 3 12 1 24 1C36 1 36 3 48 3" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
          </svg>
          <span className="text-pink-300/70 text-xs">🌱</span>
          <svg className="w-12 h-1.5 opacity-60" viewBox="0 0 48 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 3C12 3 12 5 24 5C36 5 36 3 48 3" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
          </svg>
        </div>
      </header>

      {/* Main Check-In Form */}
      <form onSubmit={handleSetMood} className="space-y-6 sm:space-y-7">
        {/* ================================================================= */}
        {/* SECTION B: Main Mood Selection Cards                              */}
        {/* ================================================================= */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-serif font-medium text-pink-100/90 tracking-wide">
              Select your current mood
            </span>
            <span className="text-[11px] font-mono text-purple-300/60 font-light">
              Tap to choose
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {MOOD_CARDS.map((card) => {
              const isSelected = selectedMoodKey === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setSelectedMoodKey(card.key);
                  }}
                  className={`mood-card ${card.hoverBorder} ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select mood: ${card.label}`}
                >
                  {/* Soft Tinted Icon Frame */}
                  <div
                    className="mood-card-icon"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <span className="select-none filter drop-shadow-sm">
                      {card.emoji}
                    </span>
                  </div>

                  {/* Short Mood Label */}
                  <span
                    className={`text-xs sm:text-sm font-serif tracking-tight truncate ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-slate-200 font-medium'
                    }`}
                  >
                    {card.label}
                  </span>

                  {/* Visible Selection Indicator Badge */}
                  {isSelected && (
                    <span
                      className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-400/35 border border-pink-300/90 flex items-center justify-center text-pink-100 shadow-sm animate-fade-in"
                      title="Selected"
                    >
                      <Check className="w-2.5 h-2.5 text-pink-100" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION C: Optional Personal Note                                 */}
        {/* ================================================================= */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label
              htmlFor="mood-journal-note"
              className="text-xs sm:text-sm font-serif font-medium text-pink-100/90 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Anything on your mind?</span>
              <span className="text-purple-300/50 font-sans text-[11px] font-normal italic">
                (Optional)
              </span>
            </label>
            <span className="text-[10px] font-mono text-purple-300/50">
              Personal journal
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-purple-400/20 focus-within:border-pink-300/50 transition-all duration-300 shadow-inner">
            <textarea
              id="mood-journal-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A thought, a quiet feeling, or something you're holding today..."
              className="mood-journal-textarea w-full p-3.5 sm:p-4 text-xs sm:text-sm font-serif leading-relaxed text-pink-50 placeholder-purple-300/40 bg-[#120a27]/75 backdrop-blur-md resize-none outline-none transition-all"
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION D: Privacy Setting & Save Action                          */}
        {/* ================================================================= */}
        <section className="space-y-4">
          {/* Privacy Selector Bar: Calm, Restrained, Clear */}
          <div className="rounded-2xl p-3 sm:p-3.5 border border-purple-400/15 bg-[#120a26]/50 backdrop-blur-sm flex items-center justify-between gap-3 transition-colors hover:border-purple-300/25">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isShared
                    ? 'bg-pink-500/15 border-pink-400/35 text-pink-300 shadow-sm shadow-pink-500/10'
                    : 'bg-white/[0.04] border-white/10 text-purple-300/70'
                }`}
              >
                {isShared ? (
                  <Globe2 className="w-4 h-4 text-pink-300" />
                ) : (
                  <Lock className="w-4 h-4 text-purple-300/90" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-medium text-slate-100">
                    {isShared ? `Share with ${partner.displayName}` : 'Private to you'}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isShared
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-purple-500/15 border-purple-400/25 text-purple-300'
                    }`}
                  >
                    {isShared ? 'Shared 🌸' : 'Private 🔒'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/60 font-light leading-snug mt-0.5 truncate">
                  {isShared
                    ? `Visible in your shared sanctuary desk for ${partner.displayName}.`
                    : 'Kept private in your personal journal. Not visible to anyone else.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setIsShared(!isShared);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
                isShared
                  ? 'bg-pink-500/20 border-pink-300/40 text-pink-100 hover:bg-pink-500/30'
                  : 'bg-white/[0.05] border-white/15 text-purple-200 hover:bg-white/[0.08] hover:border-purple-300/35'
              }`}
              title={isShared ? 'Click to make private' : `Click to share with ${partner.displayName}`}
            >
              <span>{isShared ? 'Make Private 🔒' : `Share with ${partner.displayName} ✨`}</span>
            </button>
          </div>

          {/* Action Row: Status Feedback + Tasteful Save Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-0.5">
            {/* Visual Feedback Line */}
            <div className="min-h-[22px] flex items-center">
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved to your journal 🌿</span>
                </span>
              )}
              {saveError && (
                <span className="text-xs text-rose-300 font-medium animate-fade-in">
                  {saveError}
                </span>
              )}
            </div>

            {/* Prominent but Tasteful Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-white shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #9333ea 100%)',
                boxShadow: '0 4px 18px rgba(236, 72, 153, 0.28)',
              }}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving check-in...</span>
                </>
              ) : (
                <>
                  <span>Save my check-in</span>
                  <Sparkles className="w-3.5 h-3.5 text-pink-200" />
                </>
              )}
            </button>
          </div>
        </section>
      </form>

      {/* ================================================================= */}
      {/* SECTION E: Previous Entries ("A little history")                   */}
      {/* ================================================================= */}
      <section className="space-y-3 pt-5 border-t border-purple-400/15">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-sm sm:text-base font-medium text-white flex items-center gap-2">
            <span>A little history</span>
            {moods.length > 0 && (
              <span className="text-[11px] font-mono text-purple-300/50 font-normal">
                ({moods.length})
              </span>
            )}
          </h3>
          <span className="text-[10px] font-mono text-purple-300/50">
            Past reflections
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-purple-300/50 animate-pulse">
            Gathering quiet reflections...
          </div>
        ) : moods.length === 0 ? (
          <div className="rounded-2xl p-6 text-center border border-purple-400/10 bg-[#100922]/40 text-xs text-purple-200/60 font-light font-serif italic">
            Your past reflections will quietly rest here.
          </div>
        ) : (
          <div className="space-y-2.5">
            {moods.slice(0, 10).map((item) => {
              const isMine = item.userId === currentUser.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-3 sm:p-3.5 border border-purple-400/15 bg-[#120a27]/55 backdrop-blur-sm flex items-start sm:items-center justify-between gap-3.5 transition-all hover:border-purple-300/30"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-base shrink-0">
                      {item.emoji}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-serif font-medium text-white truncate">
                          {item.moodLabel}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border ${
                            item.isShared
                              ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                              : 'bg-purple-500/15 border-purple-400/30 text-purple-300'
                          }`}
                        >
                          {item.isShared ? (
                            <>
                              <Globe2 className="w-2.5 h-2.5 text-emerald-300" />
                              <span>Shared</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5 text-purple-300" />
                              <span>Private</span>
                            </>
                          )}
                        </span>
                      </div>

                      {item.note && (
                        <p className="font-serif italic text-xs text-pink-100/85 leading-snug break-words">
                          “{item.note}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5 pl-2">
                    <p className="text-[11px] font-mono text-pink-300/90 font-medium">
                      {isMine ? 'You' : item.userName || partner.displayName}
                    </p>
                    <p className="text-[10px] font-mono text-purple-300/50">
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
      </section>
    </div>
  );
};
