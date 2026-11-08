import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Globe2,
  Clock,
  BarChart3,
  PenLine,
  X,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  moodGardenService,
  authService,
} from '../../services/gardenService';
import type { MoodEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './MoodGardenSection.module.css';

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
    subtitle: 'Grateful & Smiling',
    emoji: '😊',
    artUrl: '/assets/garden/moods/fluent/happy.png',
  },
  {
    key: 'calm',
    label: 'Calm',
    subtitle: 'Peaceful & Calm',
    emoji: '🪷',
    artUrl: '/assets/garden/moods/fluent/calm.png',
  },
  {
    key: 'in_love',
    label: 'Loved',
    subtitle: 'Warm & Special',
    emoji: '❤️',
    artUrl: '/assets/garden/moods/fluent/in_love.png',
  },
  {
    key: 'thoughtful',
    label: 'Thinking',
    subtitle: 'Deep in Thoughts',
    emoji: '💭',
    artUrl: '/assets/garden/moods/fluent/thoughtful.png',
  },
  {
    key: 'sad',
    label: 'Sad',
    subtitle: 'A Little Down',
    emoji: '💧',
    artUrl: '/assets/garden/moods/fluent/sad.png',
  },
  {
    key: 'excited',
    label: 'Excited',
    subtitle: 'Full of Energy',
    emoji: '⭐',
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
    emoji: '⭐',
    note: 'Big plans ahead for us! 💕',
    isShared: true,
    createdAt: new Date().toISOString(),
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
  const [isShared, setIsShared] = useState<boolean>(true);
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
    <div className={styles.moodSection}>
      {/* 1. Panoramic Enchanted Twilight Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroTagline}>
            <span>Our Sacred Sanctuary</span>
            <span className={styles.heroTagDot}>✦</span>
            <span>Emotional Pulse</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>Mood Garden</span>
            <span className={styles.heroTitleHeart}>♡</span>
          </h1>

          <p className={styles.heroVerbs}>Express · Reflect · Bloom</p>

          <p className={styles.heroSubtitle}>
            How are you feeling today? ♡
          </p>
        </div>

        {/* 3D Glowing Fairy Jar Artwork Frame */}
        <div className={styles.heroArtworkContainer}>
          <img
            src="/assets/garden/card_mood.jpg"
            alt="Glowing fairy lights jar with hearts"
            className={styles.heroArtworkImg}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </section>

      {/* 2. Main Interactive Sanctuary Panel */}
      <div className={styles.mainPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <h2 className={styles.panelTitle}>
              <span className={styles.panelTitleIcon}>🌸</span>
              <span>How are you feeling today?</span>
            </h2>
            <p className={styles.panelSubtitle}>
              Choose a mood that best reflects your heart right now...
            </p>
          </div>

          <div className={styles.panelHeaderActions}>
            {/* Privacy toggle pill */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setIsShared(!isShared);
              }}
              className={styles.privacyToggleBtn}
              title="Toggle privacy for check-in"
            >
              {isShared ? (
                <>
                  <Globe2 className="w-3.5 h-3.5 text-pink-300" />
                  <span>Shared with {partner.displayName} 🌸</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-purple-300" />
                  <span>Private to you 🔒</span>
                </>
              )}
            </button>

            {/* View history toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setShowHistoryModal(!showHistoryModal);
              }}
              className={styles.historyToggleBtn}
              title="View past mood check-ins"
            >
              <BarChart3 className="w-3.5 h-3.5 text-pink-300" />
              <span>History</span>
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform"
                style={{
                  transform: showHistoryModal ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* 6 Mood Cards in 3x2 Grid */}
        <div className={styles.moodGrid}>
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
                className={`${styles.moodCard} ${isSelected ? styles.moodCardActive : ''}`}
                aria-pressed={isSelected}
              >
                {/* 3D Icon / Emoji */}
                <div className={styles.moodCardArt}>
                  <img
                    src={card.artUrl}
                    alt={card.label}
                    className={styles.moodCardImg}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span
                    className={styles.moodCardEmoji}
                    style={{
                      display: 'none', // Handled if img fails
                    }}
                  >
                    {card.emoji}
                  </span>
                </div>

                {/* Body Text */}
                <div className={styles.moodCardBody}>
                  <span className={styles.moodCardTitle}>{card.label}</span>
                  <span className={styles.moodCardSubtitle}>{card.subtitle}</span>
                </div>

                {/* Radio selection circle */}
                <div className={styles.moodCardIndicator}>
                  {isSelected && <div className={styles.moodCardIndicatorInner} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Bottom Input Row & Action Form */}
        <form onSubmit={handleSetMood} className={styles.actionForm}>
          <div className={styles.inputRow}>
            <div className={styles.noteInputWrapper}>
              <span className={styles.noteInputIcon}>
                <PenLine className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="✏️ Add a Note (Optional)..."
                className={styles.noteInput}
              />
              <span className={styles.charCount}>{note.length}/500</span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className={styles.submitBtn}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save My Mood</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Feedback alerts */}
          {saveSuccess && (
            <div className={`${styles.feedbackBanner} ${styles.feedbackSuccess}`}>
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Your mood has been lovingly recorded in Our Garden. 🌿</span>
            </div>
          )}

          {saveError && (
            <div className={`${styles.feedbackBanner} ${styles.feedbackError}`}>
              <span>{saveError}</span>
            </div>
          )}
        </form>
      </div>

      {/* 4. Mood History Drawer */}
      {showHistoryModal && (
        <div className={styles.historyDrawer}>
          <div className={styles.historyHeader}>
            <div className={styles.historyTitleGroup}>
              <Clock className="w-5 h-5 text-pink-300" />
              <div>
                <h3 className={styles.historyTitle}>Our Mood History</h3>
                <p className={styles.historySubtitle}>
                  A tender timeline of emotional reflections shared together.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className={styles.historyCloseBtn}
              title="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={styles.historyList}>
            {displayList.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyItemLeft}>
                  <span className={styles.historyItemEmoji}>{item.emoji}</span>
                  <span className={styles.historyItemLabel}>{item.moodLabel}</span>
                  <span className="text-purple-400/40 select-none">•</span>
                  <span className={styles.historyItemDate}>
                    {formatHistoryDate(item.createdAt)}
                  </span>
                  {item.note && (
                    <>
                      <span className="text-purple-400/40 select-none hidden sm:inline">•</span>
                      <span className={styles.historyItemNote}>“{item.note}”</span>
                    </>
                  )}
                </div>

                <span
                  className={`${styles.historyItemPrivacy} ${
                    item.isShared ? styles.historyItemShared : styles.historyItemPrivate
                  }`}
                >
                  {item.isShared ? (
                    <>
                      <Globe2 className="w-3 h-3 text-pink-300" />
                      <span>Shared 🌸</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-purple-300" />
                      <span>Private 🔒</span>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
