import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Compass,
  Gift,
  PartyPopper,
  Bell,
} from 'lucide-react';
import { hangoutService } from '../../services/gardenService';
import {
  getUpcomingCelebrations,
  type UpcomingCelebration,
} from '../../services/celebrationService';
import type { HangoutEntry } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './LoveMilestoneWidget.module.css';

interface LoveMilestoneWidgetProps {
  onSelectTab: (tab: any) => void;
}

export function parseHangoutDate(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Try standard ISO or parseable date
  const direct = new Date(trimmed);
  if (!isNaN(direct.getTime()) && direct.getFullYear() > 2000) {
    return direct;
  }

  // 2. Relative or natural language like 'This Saturday @ 5:30 PM' or 'Friday 7:00 PM'
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const lower = trimmed.toLowerCase();
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);

      const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3];
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        target.setHours(hours, mins, 0, 0);
      } else {
        target.setHours(18, 0, 0, 0); // default 6 PM
      }
      return target;
    }
  }

  // 3. Match 'Tomorrow'
  if (lower.includes('tomorrow')) {
    const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3];
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      target.setHours(hours, mins, 0, 0);
    } else {
      target.setHours(18, 0, 0, 0);
    }
    return target;
  }

  return null;
}

export const LoveMilestoneWidget: React.FC<LoveMilestoneWidgetProps> = ({ onSelectTab }) => {
  // Hangout countdown state
  const [hangouts, setHangouts] = useState<HangoutEntry[]>([]);
  const [now, setNow] = useState<Date>(new Date());

  // Countdown mode: 'celebrations' (Birthdays / Holidays) vs 'date' (Hangout)
  const [countdownMode, setCountdownMode] = useState<'date' | 'celebrations'>('celebrations');
  const [selectedCelebrationId, setSelectedCelebrationId] = useState<string | null>(null);

  // Tick every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch hangouts
  const loadHangouts = useCallback(async () => {
    try {
      const list = await hangoutService.getHangouts();
      setHangouts(list);
    } catch (e) {
      console.warn('Could not load hangouts for countdown:', e);
    }
  }, []);

  useEffect(() => {
    loadHangouts();
    const handleUpdate = () => loadHangouts();
    window.addEventListener('garden-hangouts-updated', handleUpdate);
    return () => window.removeEventListener('garden-hangouts-updated', handleUpdate);
  }, [loadHangouts]);

  // Celebrations list (Chronologically sorted)
  const celebrations: UpcomingCelebration[] = useMemo(() => {
    return getUpcomingCelebrations(now);
  }, [now]);

  // Active celebration
  const activeCelebration: UpcomingCelebration = useMemo(() => {
    if (selectedCelebrationId) {
      const found = celebrations.find((c) => c.id === selectedCelebrationId);
      if (found) return found;
    }
    return celebrations[0];
  }, [celebrations, selectedCelebrationId]);

  // Check if any celebration has an active reminder (within 14 days or today)
  const reminderCelebration = useMemo(() => {
    return celebrations.find((c) => c.daysUntil <= 14);
  }, [celebrations]);

  // Celebration countdown parts
  const celebrationCountdownParts = useMemo(() => {
    if (!activeCelebration) return null;
    const diffMs = activeCelebration.targetDate.getTime() - now.getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }, [activeCelebration, now]);

  // Find next upcoming hangout
  const nextHangoutData = useMemo(() => {
    const valid = hangouts.filter(
      (h) => h.status !== 'declined' && h.status !== 'completed'
    );

    const withResolvedDates = valid
      .map((h) => {
        const parsed = parseHangoutDate(h.proposedDate);
        return { hangout: h, parsedDate: parsed };
      })
      .filter((x): x is { hangout: HangoutEntry; parsedDate: Date } => {
        return x.parsedDate !== null && x.parsedDate.getTime() > now.getTime();
      });

    withResolvedDates.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (withResolvedDates.length === 0) {
      const fallback = valid[0];
      return fallback ? { hangout: fallback, parsedDate: null, diffMs: null } : null;
    }

    const first = withResolvedDates[0];
    const diffMs = first.parsedDate.getTime() - now.getTime();
    return {
      hangout: first.hangout,
      parsedDate: first.parsedDate,
      diffMs,
    };
  }, [hangouts, now]);

  // Format hangout countdown digits
  const hangoutCountdownParts = useMemo(() => {
    if (!nextHangoutData || !nextHangoutData.diffMs || nextHangoutData.diffMs <= 0) {
      return null;
    }
    const totalSecs = Math.floor(nextHangoutData.diffMs / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }, [nextHangoutData]);

  // Switch to a celebration when tapping its chip
  const handleSelectCelebration = (id: string) => {
    soundEngine.playSparkle();
    setSelectedCelebrationId(id);
    setCountdownMode('celebrations');
  };

  return (
    <div className={styles.widgetContainer}>
      {/* CELEBRATIONS & SPECIAL OCCASIONS COUNTDOWN CARD */}
      <div className={styles.countdownCard}>
        <div className={styles.countdownGlow} />

        {/* 1. Card Top Bar with Title, Mode Switcher & Date Badge */}
        <div className={styles.cardHeader}>
          <div className="flex items-center gap-2">
            <div className={styles.modeSwitcher}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setCountdownMode('celebrations');
                }}
                className={`${styles.modeBtn} ${countdownMode === 'celebrations' ? styles.modeBtnActive : ''}`}
              >
                <Gift className="w-3.5 h-3.5 text-pink-300" />
                <span>Birthdays & Holidays</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setCountdownMode('date');
                }}
                className={`${styles.modeBtn} ${countdownMode === 'date' ? styles.modeBtnActive : ''}`}
              >
                <Compass className="w-3.5 h-3.5 text-purple-300" />
                <span>Next Hangout</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {countdownMode === 'celebrations' && (
              <span className="text-[11px] font-mono font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/35 shadow-sm">
                {activeCelebration.formattedDate}
              </span>
            )}

            {countdownMode === 'date' && nextHangoutData?.hangout.status && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {nextHangoutData.hangout.status === 'confirmed' ? '✨ Confirmed' : '💡 Proposed'}
              </span>
            )}
          </div>
        </div>

        {/* 2. Proactive Notification Reminder Banner (if an event is within 14 days) */}
        {reminderCelebration && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 border border-pink-400/30 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-pink-200 min-w-0">
              <Bell className="w-3.5 h-3.5 text-amber-300 animate-bounce shrink-0" />
              <span className="truncate">
                {reminderCelebration.isToday ? (
                  <strong className="text-amber-200">TODAY is {reminderCelebration.title}! 🎉</strong>
                ) : (
                  <>
                    <strong className="text-pink-100">{reminderCelebration.title}</strong> is in{' '}
                    <span className="text-amber-300 font-bold">{reminderCelebration.daysUntil} days</span> ✨
                  </>
                )}
              </span>
            </div>
            {activeCelebration.id !== reminderCelebration.id && (
              <button
                type="button"
                onClick={() => handleSelectCelebration(reminderCelebration.id)}
                className="text-[10px] font-semibold text-pink-300 hover:text-white underline shrink-0 cursor-pointer"
              >
                View
              </button>
            )}
          </div>
        )}

        {/* MODE A: CELEBRATIONS (Birthdays & Holidays) */}
        {countdownMode === 'celebrations' && (
          <div>
            {/* If Today is the celebration! */}
            {activeCelebration.isToday ? (
              <div
                className={`${styles.todayCelebrationBanner} cursor-pointer hover:scale-[1.01] active:scale-95 transition-transform`}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('garden-trigger-celebration', {
                      detail: { celebration: activeCelebration },
                    })
                  );
                }}
                title="Tap to pop full celebration confetti! 🎊"
              >
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-sm">
                  <PartyPopper className="w-4 h-4 animate-bounce" />
                  <span>TODAY IS THE DAY! ✨ (Tap to Celebrate 🎊)</span>
                </div>
                <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                  {activeCelebration.title}
                </h4>
                <p className="text-xs text-pink-100 font-serif italic">
                  “{activeCelebration.subtitle}”
                </p>
              </div>
            ) : celebrationCountdownParts ? (
              /* Live Ticking Countdown Digits to Birthday / Holiday */
              <div className={styles.countdownDigitsGrid}>
                <div className={styles.digitBox}>
                  <span className={styles.digitValue}>{celebrationCountdownParts.days}</span>
                  <span className={styles.digitLabel}>Days</span>
                </div>
                <div className={styles.digitBox}>
                  <span className={styles.digitValue}>{celebrationCountdownParts.hours}</span>
                  <span className={styles.digitLabel}>Hours</span>
                </div>
                <div className={styles.digitBox}>
                  <span className={styles.digitValue}>{celebrationCountdownParts.minutes}</span>
                  <span className={styles.digitLabel}>Mins</span>
                </div>
                <div className={styles.digitBox}>
                  <span className={styles.digitValue}>{celebrationCountdownParts.seconds}</span>
                  <span className={styles.digitLabel}>Secs</span>
                </div>
              </div>
            ) : null}

            {/* Celebration Details Bar */}
            <div className={styles.dateInfoBox}>
              <div className="min-w-0 flex-1 pr-2">
                <h4 className={styles.dateTitle}>
                  <span className="text-base">{activeCelebration.emoji}</span>
                  <span className="truncate">{activeCelebration.title}</span>
                </h4>
                <div className={styles.dateMeta}>
                  <span>{activeCelebration.subtitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  onSelectTab('time');
                }}
                className={styles.viewButton}
                title="Plan something sweet in Our Time"
              >
                <span>Plan Date 🌹</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* MODE B: NEXT HANGOUT COUNTDOWN */}
        {countdownMode === 'date' && nextHangoutData && hangoutCountdownParts && (
          <div>
            {/* Live Ticking Digits Grid */}
            <div className={styles.countdownDigitsGrid}>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{hangoutCountdownParts.days}</span>
                <span className={styles.digitLabel}>Days</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{hangoutCountdownParts.hours}</span>
                <span className={styles.digitLabel}>Hours</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{hangoutCountdownParts.minutes}</span>
                <span className={styles.digitLabel}>Mins</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{hangoutCountdownParts.seconds}</span>
                <span className={styles.digitLabel}>Secs</span>
              </div>
            </div>

            {/* Date Details Bar */}
            <div className={styles.dateInfoBox}>
              <div className="min-w-0 flex-1 pr-2">
                <h4 className={styles.dateTitle} title={nextHangoutData.hangout.title}>
                  <span>🌹</span>
                  <span className="truncate">{nextHangoutData.hangout.title}</span>
                </h4>
                <div className={styles.dateMeta}>
                  {nextHangoutData.hangout.proposedDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pink-300" />
                      <span>{nextHangoutData.hangout.proposedDate}</span>
                    </span>
                  )}
                  {nextHangoutData.hangout.location && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-purple-300" />
                      <span className="truncate">{nextHangoutData.hangout.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  onSelectTab('time');
                }}
                className={styles.viewButton}
                title="View in Our Time"
              >
                <span>View Date</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {countdownMode === 'date' && nextHangoutData && !hangoutCountdownParts && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-400/20 text-center">
              <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                <span>🌹</span>
                <span>{nextHangoutData.hangout.title}</span>
              </h4>
              <p className="text-xs text-pink-200/90 mt-1">
                ⏳ {nextHangoutData.hangout.proposedDate || 'Coming up soon ♡'}
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  onSelectTab('time');
                }}
                className={styles.viewButton}
              >
                <span>Open in Our Time</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {countdownMode === 'date' && !nextHangoutData && (
          <div className={styles.emptyDateContainer}>
            <div className="w-9 h-9 rounded-2xl bg-white/5 border border-purple-400/20 flex items-center justify-center text-pink-300 text-base shadow-inner">
              🌷
            </div>
            <div>
              <h4 className={styles.emptyTitle}>No Upcoming Hangout Scheduled</h4>
              <p className={styles.emptyText}>
                Next celebration is {activeCelebration.title} ({activeCelebration.daysUntil} days away). Propose a sweet adventure!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                onSelectTab('time');
              }}
              className={styles.viewButton}
            >
              <span>+ Plan Next Date</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 3. ALWAYS-VISIBLE CELEBRATIONS RADAR CHIPS (Noella, Solomon, Christmas, New Year, Valentine's) */}
        <div className={styles.celebrationsChips} title="Upcoming Birthdays & Special Days">
          {celebrations.map((c) => {
            const isSelected = countdownMode === 'celebrations' && activeCelebration.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCelebration(c.id)}
                className={`${styles.celebrationChip} ${isSelected ? styles.celebrationChipActive : ''}`}
                title={`${c.title} • ${c.daysUntil} days away`}
              >
                <span>{c.emoji}</span>
                <span>
                  {c.id === 'noella-bday'
                    ? "Noella's Birthday"
                    : c.id === 'solomon-bday'
                    ? "Solomon's Birthday"
                    : c.title.replace(/ 🎂| 🎄| 🥂| 🌹/g, '')}
                </span>
                <span className="text-[10px] opacity-80 font-mono font-semibold">
                  {c.isToday ? 'Today! 🎉' : `${c.daysUntil}d`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
