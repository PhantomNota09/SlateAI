import { describe, expect, it } from "vitest";
import { parseUserStats } from "./UserStats";

describe("parseUserStats", () => {
  it("parses a full document", () => {
    const s = parseUserStats({
      username: "sam", displayName: "Sam R", avatarURL: "", moviesWatched: 40, moviesRated: 30, letterboxdMoviesRated: 10,
      totalMoviesRated: 40, avgRating: 3.9, topGenres: ["Drama", "Sci-Fi"], weeklyRated: 4, totalPoints: 40,
      joinedAt: { toDate: () => new Date("2026-01-05T00:00:00Z") },
      currentStreak: 6, longestStreak: 12, lastInteractionDate: "2026-09-28",
      earnedBadges: ["streak_3"], badgeEarnedDates: { streak_3: "2026-02-01" },
    });
    expect(s).toMatchObject({ username: "sam", totalMoviesRated: 40, currentStreak: 6, topGenres: ["Drama", "Sci-Fi"] });
    expect(s.joinedAt?.getUTCFullYear()).toBe(2026);
  });

  it("survives a partial seed document (only username and displayName)", () => {
    const s = parseUserStats({ username: "sam", displayName: "Sam" });
    expect(s).toMatchObject({ moviesRated: 0, totalMoviesRated: 0, avgRating: 0, topGenres: [], earnedBadges: [], joinedAt: null, currentStreak: 0, lastInteractionDate: null });
  });

  it("derives totalMoviesRated on older documents", () => {
    expect(parseUserStats({ moviesRated: 5, letterboxdMoviesRated: 7 }).totalMoviesRated).toBe(12);
    expect(parseUserStats({ moviesRated: 5 }).totalMoviesRated).toBe(5);
  });

  it("ignores wrong-typed fields instead of crashing", () => {
    const s = parseUserStats({ moviesRated: "many", topGenres: "Drama", earnedBadges: [1, "streak_3", null], badgeEarnedDates: { a: 5, b: "2026-01-01" }, avgRating: NaN });
    expect(s).toMatchObject({ moviesRated: 0, topGenres: [], earnedBadges: ["streak_3"], badgeEarnedDates: { b: "2026-01-01" }, avgRating: 0 });
  });

  it("handles a missing document", () => {
    expect(parseUserStats(undefined).earnedBadges).toEqual([]);
  });
});
