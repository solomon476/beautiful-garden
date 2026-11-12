import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Heart,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Edit3,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { hangoutService } from '../../services/gardenService';
import type { HangoutEntry } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './LoveMilestoneWidget.module.css';

interface LoveMilestoneWidgetProps {
  onSelectTab: (tab: any) => void;
}

const STORAGE_KEY_ANNIVERSARY = 'perfect_time_anniversary_date';
const DEFAULT_ANNIVERSARY = '2024-10-24'; // Solomon & Noella's Journey Start Date

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
  // Anniversary state
  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_ANNIVERSARY) || DEFAULT_ANNIVERSARY;
    }
    return DEFAULT_ANNIVERSARY;
  });

  const [isEditingAnniversary, setIsEditingAnniversary] = useState<boolean>(false);
  const [tempAnniversaryDate, setTempAnniversaryDate] = useState<string>(anniversaryDate);

  // Hangout countdown state
  const [hangouts, setHangouts] = useState<HangoutEntry[]>([]);
  const [now, setNow] = useState<Date>(new Date());

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

  // Calculate Days Together
  const milestoneData = useMemo(() => {
    const start = new Date(anniversaryDate + 'T00:00:00');
    const diffMs = now.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Next 100-day milestone
    const next100 = Math.ceil((totalDays + 1) / 100) * 100;
    const daysUntilNext100 = next100 - totalDays;

    // Next yearly anniversary
    const currentYear = now.getFullYear();
    let nextAnniv = new Date(start);
    nextAnniv.setFullYear(currentYear);
    if (nextAnniv.getTime() <= now.getTime()) {
      nextAnniv.setFullYear(currentYear + 1);
    }
    const daysUntilAnniversary = Math.ceil(
      (nextAnniv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalDays,
      next100,
      daysUntilNext100,
      daysUntilAnniversary,
      formattedStart: start.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }, [anniversaryDate, now]);

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
      // If there are proposed hangouts with unparseable relative date, show the first proposed
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

  // Handle save anniversary date
  const handleSaveAnniversary = () => {
    if (!tempAnniversaryDate) return;
    soundEngine.playSparkle();
    setAnniversaryDate(tempAnniversaryDate);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ANNIVERSARY, tempAnniversaryDate);
    }
    setIsEditingAnniversary(false);
  };

  // Format countdown digits
  const countdownParts = useMemo(() => {
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

  return (
    <div className={styles.widgetContainer}>
      {/* 1. DAYS TOGETHER MILESTONE CARD */}
      <div className={styles.milestoneCard}>
        <div className={styles.cardGlow} />

        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.badge}>
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
            <span>Days Together</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setTempAnniversaryDate(anniversaryDate);
              setIsEditingAnniversary(true);
            }}
            className={styles.editButton}
            title="Set Our Anniversary / First Date"
            aria-label="Set anniversary date"
          >
            <Edit3 className="w-3.5 h-3.5 text-pink-200" />
          </button>
        </div>

        {/* Counter Body */}
        <div>
          <div className={styles.counterBody}>
            <span className={styles.counterLabel}>Day</span>
            <span className={styles.counterNumber}>{milestoneData.totalDays}</span>
            <span className={styles.counterUnit}>of Our Story ♡</span>
          </div>

          <p className={styles.quoteText}>
            “Every single sunrise by your side is a treasured blessing.”
          </p>
        </div>

        {/* Footer: Milestones Indicator */}
        <div className={styles.milestoneFooter}>
          <div className={styles.milestoneNext}>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Next: Day {milestoneData.next100} in {milestoneData.daysUntilNext100} days
            </span>
          </div>
          <span className="text-[11px] opacity-75">Since {milestoneData.formattedStart}</span>
        </div>
      </div>

      {/* 2. NEXT DATE / LIVE COUNTDOWN CARD */}
      <div className={styles.countdownCard}>
        <div className={styles.countdownGlow} />

        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.badge}>
            <Compass className="w-3.5 h-3.5 text-purple-300" />
            <span>Next Date Countdown</span>
          </div>
          {nextHangoutData?.hangout.status && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              {nextHangoutData.hangout.status === 'confirmed' ? '✨ Confirmed' : '💡 Proposed'}
            </span>
          )}
        </div>

        {/* Content */}
        {nextHangoutData && countdownParts ? (
          <div>
            {/* Live Ticking Digits Grid */}
            <div className={styles.countdownDigitsGrid}>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{countdownParts.days}</span>
                <span className={styles.digitLabel}>Days</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{countdownParts.hours}</span>
                <span className={styles.digitLabel}>Hours</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{countdownParts.minutes}</span>
                <span className={styles.digitLabel}>Mins</span>
              </div>
              <div className={styles.digitBox}>
                <span className={styles.digitValue}>{countdownParts.seconds}</span>
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
        ) : nextHangoutData && !countdownParts ? (
          /* When date is entered in natural speech but not parsed as exact Unix timestamp */
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
        ) : (
          /* Empty Hangouts State */
          <div className={styles.emptyDateContainer}>
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-purple-400/20 flex items-center justify-center text-pink-300 text-lg shadow-inner">
              🌷
            </div>
            <div>
              <h4 className={styles.emptyTitle}>No Upcoming Date Yet</h4>
              <p className={styles.emptyText}>
                Our next sweet adventure is waiting to be planned. Propose a date!
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
      </div>

      {/* 3. ANNIVERSARY DATE PICKER POPOVER MODAL */}
      {isEditingAnniversary && (
        <div
          className={styles.popoverOverlay}
          onClick={() => setIsEditingAnniversary(false)}
        >
          <div
            className={styles.popoverCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="anniversary-modal-title"
          >
            <div className="flex items-center justify-between pb-2 border-b border-pink-400/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <h3 id="anniversary-modal-title" className="font-serif font-bold text-base text-white">
                  Our Special Beginning Date
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAnniversary(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Choose the day your story began together (first date, anniversary, or official start). The counter will track every precious day you share!
            </p>

            <div className="space-y-1.5">
              <label htmlFor="anniversary-date-input" className="text-xs font-semibold text-pink-200">
                Start Date:
              </label>
              <input
                id="anniversary-date-input"
                type="date"
                value={tempAnniversaryDate}
                onChange={(e) => setTempAnniversaryDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingAnniversary(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnniversary}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/30 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Date ♡</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
