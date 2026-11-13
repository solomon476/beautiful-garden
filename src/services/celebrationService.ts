export interface SpecialCelebration {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  month: number; // 0-indexed: 0 = Jan, 4 = May, 8 = Sept, 11 = Dec
  day: number;
  person?: 'noella' | 'solomon' | 'both';
  badgeColor?: string;
}

export interface UpcomingCelebration extends SpecialCelebration {
  targetDate: Date;
  daysUntil: number;
  isToday: boolean;
  formattedDate: string;
}

export const SPECIAL_CELEBRATIONS: SpecialCelebration[] = [
  {
    id: 'noella-bday',
    title: "Noella's Birthday 🎂",
    subtitle: "Celebrating my favorite person in the world Noella ✨",
    emoji: '🌸',
    month: 8, // September
    day: 11,
    person: 'noella',
    badgeColor: 'border-pink-400/50 text-pink-200 bg-pink-500/20',
  },
  {
    id: 'solomon-bday',
    title: "Solomon's Birthday 🎂",
    subtitle: "Celebrating Solomon's special day and good times ✨",
    emoji: '🎉',
    month: 4, // May
    day: 25,
    person: 'solomon',
    badgeColor: 'border-purple-400/50 text-purple-200 bg-purple-500/20',
  },
  {
    id: 'christmas',
    title: "Christmas Magic 🎄",
    subtitle: "Cozy holiday hugs, laughter, and winter warmth ❄️",
    emoji: '🎄',
    month: 11, // December
    day: 25,
    person: 'both',
    badgeColor: 'border-emerald-400/50 text-emerald-200 bg-emerald-500/20',
  },
  {
    id: 'new-year',
    title: "New Year's Eve 🥂",
    subtitle: "Stepping into another bright and beautiful year together ✨",
    emoji: '🥂',
    month: 11, // December
    day: 31,
    person: 'both',
    badgeColor: 'border-amber-400/50 text-amber-200 bg-amber-500/20',
  },
  {
    id: 'valentines',
    title: "Valentine's Day 🌹",
    subtitle: "A sweet day to celebrate someone very special ✨",
    emoji: '🌹',
    month: 1, // February
    day: 14,
    person: 'both',
    badgeColor: 'border-rose-400/50 text-rose-200 bg-rose-500/20',
  },
];

/**
 * Returns all upcoming celebrations sorted in chronological order
 */
export function getUpcomingCelebrations(refDate: Date = new Date()): UpcomingCelebration[] {
  const currentYear = refDate.getFullYear();

  return SPECIAL_CELEBRATIONS.map((c) => {
    let target = new Date(currentYear, c.month, c.day, 0, 0, 0, 0);

    // If target has passed this year, roll over to next year
    // Note: if it's today, keep today
    const isToday =
      target.getDate() === refDate.getDate() && target.getMonth() === refDate.getMonth();

    if (!isToday && target.getTime() < refDate.getTime()) {
      target = new Date(currentYear + 1, c.month, c.day, 0, 0, 0, 0);
    }

    const diffMs = target.getTime() - refDate.getTime();
    const daysUntil = isToday ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      ...c,
      targetDate: target,
      daysUntil: Math.max(0, daysUntil),
      isToday,
      formattedDate: target.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    };
  }).sort((a, b) => {
    // Today comes first, then earliest daysUntil
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    return a.daysUntil - b.daysUntil;
  });
}

/**
 * Returns today's celebration if today matches any special date
 */
export function getTodayCelebration(refDate: Date = new Date()): UpcomingCelebration | null {
  const all = getUpcomingCelebrations(refDate);
  return all.find((c) => c.isToday) || null;
}

