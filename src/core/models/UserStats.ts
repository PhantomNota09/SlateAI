// `userStats/{uid}` — denormalized, Cloud-Function-owned aggregates (spec §2). The client may
// only ever update displayName, username and the streak/badge fields, so the profile page is
// read-only. Documents can be partial (e.g. created by the signup seed before the function's
// first write), so every field is parsed defensively.
export interface UserStats {
  username: string;
  displayName: string;
  avatarURL: string;
  moviesWatched: number;
  moviesRated: number; // Slate-only ratings
  letterboxdMoviesRated: number;
  totalMoviesRated: number; // moviesRated + letterboxdMoviesRated
  avgRating: number;
  topGenres: string[]; // display names, not TMDb IDs
  weeklyRated: number;
  totalPoints: number;
  joinedAt: Date | null;
  currentStreak: number;
  longestStreak: number;
  lastInteractionDate: string | null; // "YYYY-MM-DD" (UTC)
  earnedBadges: string[];
  badgeEarnedDates: Record<string, string>; // badgeId -> "YYYY-MM-DD"
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function toDate(v: unknown): Date | null {
  const t = v as { toDate?: () => Date } | undefined;
  if (typeof t?.toDate === "function") return t.toDate();
  return v instanceof Date ? v : null;
}

export function parseUserStats(data: Record<string, unknown> | undefined): UserStats {
  const d = data ?? {};
  const moviesRated = num(d.moviesRated);
  const letterboxd = num(d.letterboxdMoviesRated);
  const dates: Record<string, string> = {};
  if (d.badgeEarnedDates && typeof d.badgeEarnedDates === "object") {
    for (const [k, v] of Object.entries(d.badgeEarnedDates as Record<string, unknown>)) {
      if (typeof v === "string") dates[k] = v;
    }
  }
  return {
    username: str(d.username),
    displayName: str(d.displayName),
    avatarURL: str(d.avatarURL),
    moviesWatched: num(d.moviesWatched),
    moviesRated,
    letterboxdMoviesRated: letterboxd,
    // Older docs predate the stored total; derive it the way the function does.
    totalMoviesRated: typeof d.totalMoviesRated === "number" ? d.totalMoviesRated : moviesRated + letterboxd,
    avgRating: num(d.avgRating),
    topGenres: strings(d.topGenres),
    weeklyRated: num(d.weeklyRated),
    totalPoints: num(d.totalPoints),
    joinedAt: toDate(d.joinedAt),
    currentStreak: num(d.currentStreak),
    longestStreak: num(d.longestStreak),
    lastInteractionDate: typeof d.lastInteractionDate === "string" ? d.lastInteractionDate : null,
    earnedBadges: strings(d.earnedBadges),
    badgeEarnedDates: dates,
  };
}
