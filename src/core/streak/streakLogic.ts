// Pure port of StreakService.recordInteraction (Slate/Core/Services/StreakService.swift).
// Days are UTC calendar days ("YYYY-MM-DD"), exactly as on iOS, so a streak never disagrees
// between platforms. No Firebase in here: the service applies the result inside a transaction.

// Ascending, like iOS: crossing several at once awards them all and reports the highest.
export const STREAK_BADGE_THRESHOLDS: readonly (readonly [number, string])[] = [
  [3, "streak_3"],
  [7, "streak_7"],
  [30, "streak_30"],
  [100, "streak_100"],
  [365, "streak_365"],
];

export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function utcYesterday(date: Date = new Date()): string {
  return utcDay(new Date(date.getTime() - 24 * 60 * 60 * 1000));
}

export type StreakEvent =
  | { kind: "already" } // already counted today: nothing to write
  | { kind: "first"; streak: number }
  | { kind: "extended"; streak: number }
  | { kind: "reset"; streak: number; longestWas: number }; // missed 2+ days

// The only userStats fields the client may write (firestore.rules /userStats update whitelist).
export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastInteractionDate: string;
  earnedBadges?: string[];
  badgeEarnedDates?: Record<string, string>;
}

export interface StreakOutcome {
  event: StreakEvent;
  badgeId: string | null; // highest newly earned streak badge, if any
  update: StreakUpdate | null; // null when there is nothing to write
}

const int = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) ? v : 0);

export function computeStreak(data: Record<string, unknown>, now: Date = new Date()): StreakOutcome {
  const today = utcDay(now);
  const lastDate = typeof data.lastInteractionDate === "string" ? data.lastInteractionDate : null;
  const currentStreak = int(data.currentStreak);
  const longestStreak = int(data.longestStreak);
  const earned = Array.isArray(data.earnedBadges) ? data.earnedBadges.filter((b): b is string => typeof b === "string") : [];
  const dates: Record<string, string> = {};
  if (data.badgeEarnedDates && typeof data.badgeEarnedDates === "object") {
    for (const [k, v] of Object.entries(data.badgeEarnedDates as Record<string, unknown>)) {
      if (typeof v === "string") dates[k] = v;
    }
  }

  // Idempotent within a UTC day.
  if (lastDate === today) return { event: { kind: "already" }, badgeId: null, update: null };

  let newStreak: number;
  let base: StreakEvent;
  if (lastDate === null) {
    newStreak = 1;
    base = { kind: "first", streak: 1 };
  } else if (lastDate === utcYesterday(now)) {
    newStreak = currentStreak + 1;
    base = { kind: "extended", streak: newStreak };
  } else {
    newStreak = 1;
    base = { kind: "reset", streak: 1, longestWas: longestStreak };
  }

  const updatedBadges = [...earned];
  const updatedDates = { ...dates };
  let badgeId: string | null = null;
  for (const [threshold, id] of STREAK_BADGE_THRESHOLDS) {
    if (newStreak >= threshold && !updatedBadges.includes(id)) {
      updatedBadges.push(id);
      updatedDates[id] = today;
      badgeId = id;
    }
  }

  const update: StreakUpdate = {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastInteractionDate: today,
  };
  if (updatedBadges.length > earned.length) {
    update.earnedBadges = updatedBadges;
    update.badgeEarnedDates = updatedDates;
  }
  return { event: base, badgeId, update };
}
