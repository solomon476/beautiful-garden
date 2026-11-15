import type { MemoryEntry } from '../types/garden';

export interface FlashbackItem {
  memory: MemoryEntry;
  headline: string;
  badge: string;
  relativeTime: string;
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Finds memory flashbacks for "On This Day" / Romantic Time Machine.
 * Analyzes dates with graceful fallbacks so there is always a meaningful keepsake to relive.
 */
export function getOnThisDayFlashbacks(memories: MemoryEntry[]): FlashbackItem[] {
  if (!memories || memories.length === 0) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentYear = now.getFullYear();

  const exactSameDayMatches: FlashbackItem[] = [];
  const sameMonthMatches: FlashbackItem[] = [];
  const generalFlashbacks: FlashbackItem[] = [];

  for (const mem of memories) {
    let memDate: Date | null = null;

    // 1. Try parsing ISO string
    if (mem.createdAt) {
      const parsed = new Date(mem.createdAt);
      if (!isNaN(parsed.getTime())) {
        memDate = parsed;
      }
    }

    // 2. Try parsing custom text date (e.g. "24 October 2024", "Oct 2026", "24october")
    if (mem.dateTaken) {
      const lower = mem.dateTaken.toLowerCase();
      // Match day number
      const dayMatch = lower.match(/\b([1-9]|[12][0-9]|3[01])\b/) || lower.match(/([0-9]{1,2})/);
      // Match month name
      const matchedMonthIdx = MONTH_NAMES.findIndex((m) => lower.includes(m.slice(0, 3)));

      if (matchedMonthIdx !== -1 && dayMatch) {
        const d = parseInt(dayMatch[1], 10);
        // Match year if present
        const yearMatch = lower.match(/\b(20[2-3][0-9])\b/);
        const y = yearMatch ? parseInt(yearMatch[1], 10) : currentYear - 1;
        memDate = new Date(y, matchedMonthIdx, d);
      }
    }

    if (memDate) {
      const mMonth = memDate.getMonth();
      const mDate = memDate.getDate();
      const mYear = memDate.getFullYear();
      const yearsDiff = currentYear - mYear;

      if (mMonth === currentMonth && mDate === currentDate && yearsDiff > 0) {
        exactSameDayMatches.push({
          memory: mem,
          headline: `✨ Exactly Today in ${mYear} ♡`,
          badge: `💍 ${yearsDiff} Year${yearsDiff > 1 ? 's' : ''} Ago Today • Golden Memory`,
          relativeTime: `${yearsDiff} year${yearsDiff > 1 ? 's' : ''} ago`,
        });
        continue;
      }

      if (mMonth === currentMonth) {
        const monthCap = MONTH_NAMES[currentMonth].charAt(0).toUpperCase() + MONTH_NAMES[currentMonth].slice(1);
        sameMonthMatches.push({
          memory: mem,
          headline: `🌸 Reliving Our ${monthCap} Days ♡`,
          badge: `✨ Reminiscing This Month ♡`,
          relativeTime: `${mem.dateTaken || 'Past Month'}`,
        });
        continue;
      }
    }

    generalFlashbacks.push({
      memory: mem,
      headline: '💫 Stolen Moments Rewind ✨',
      badge: '💌 Nostalgia Vault • Keepsake',
      relativeTime: mem.dateTaken || 'Special Day',
    });
  }

  if (exactSameDayMatches.length > 0) {
    return exactSameDayMatches;
  }

  if (sameMonthMatches.length > 0) {
    return sameMonthMatches;
  }

  // Return the first 3 general flashbacks so the couple always has a memory to reminisce on
  return generalFlashbacks.slice(0, 3);
}

