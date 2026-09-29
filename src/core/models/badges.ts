import type { UserStats } from "./UserStats";

// Mirrors Slate/Core/Models/BadgeCatalog.swift — same ids, names, descriptions, thresholds and
// order. Earning is done by the streak service and Cloud Functions, never by this catalog.
export type BadgeCategory = "Streaks" | "Films Rated" | "Achievements";

export type BadgeIconKey =
  | "flame" | "ticket" | "film" | "trophy" | "star" | "clapper" | "stack" | "archive" | "import" | "friends";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  threshold: number | null; // null = achievement (binary)
  icon: BadgeIconKey;
}

export const BADGES: readonly BadgeDefinition[] = [
  { id: "streak_3", name: "Coming Attraction", description: "3 days in a row", category: "Streaks", threshold: 3, icon: "flame" },
  { id: "streak_7", name: "Weekly Matinee", description: "You showed up every day this week", category: "Streaks", threshold: 7, icon: "flame" },
  { id: "streak_30", name: "Monthly Pass", description: "30 days of daily film discovery", category: "Streaks", threshold: 30, icon: "ticket" },
  { id: "streak_100", name: "Dedicated Cinephile", description: "100 days without missing a single one", category: "Streaks", threshold: 100, icon: "film" },
  { id: "streak_365", name: "Auteur", description: "A full year of daily film discovery", category: "Streaks", threshold: 365, icon: "trophy" },
  { id: "movies_10", name: "Opening Credits", description: "Rated your first 10 films", category: "Films Rated", threshold: 10, icon: "star" },
  { id: "movies_50", name: "Half a Century", description: "50 films rated", category: "Films Rated", threshold: 50, icon: "star" },
  { id: "movies_100", name: "Film Buff", description: "100 films and counting", category: "Films Rated", threshold: 100, icon: "clapper" },
  { id: "movies_250", name: "Repertoire", description: "A serious collection — 250 films", category: "Films Rated", threshold: 250, icon: "stack" },
  { id: "movies_500", name: "The Archive", description: "500 films logged", category: "Films Rated", threshold: 500, icon: "archive" },
  { id: "letterboxd_import", name: "Brought the Collection", description: "Imported your Letterboxd history", category: "Achievements", threshold: null, icon: "import" },
  { id: "first_friend", name: "Screening Partner", description: "Added your first friend on Slate", category: "Achievements", threshold: null, icon: "friends" },
];

export interface BadgeProgress {
  earned: boolean;
  earnedDate: string | null; // "YYYY-MM-DD"
  current: number | null; // progress toward the threshold; null for achievements
  unit: "day streak" | "films rated" | null;
}

// Progress shown in the badge dialog (BadgeDetailSheet): streak badges track the *current*
// streak, film badges the total rated (Slate + Letterboxd).
export function badgeProgress(badge: BadgeDefinition, stats: UserStats): BadgeProgress {
  const earned = stats.earnedBadges.includes(badge.id);
  const earnedDate = stats.badgeEarnedDates[badge.id] ?? null;
  if (badge.threshold === null) return { earned, earnedDate, current: null, unit: null };
  const streak = badge.category === "Streaks";
  const value = streak ? stats.currentStreak : stats.totalMoviesRated;
  return { earned, earnedDate, current: Math.min(value, badge.threshold), unit: streak ? "day streak" : "films rated" };
}

// Dates are stored as UTC "YYYY-MM-DD"; format them as that UTC day so they never shift by timezone.
export function formatBadgeDate(iso: string | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);
}
