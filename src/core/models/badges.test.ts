import { describe, expect, it } from "vitest";
import { BADGES, badgeProgress, formatBadgeDate } from "./badges";
import { parseUserStats } from "./UserStats";

describe("badge catalog (mirrors iOS BadgeCatalog.swift)", () => {
  it("has the 12 iOS badges with unique ids in display order", () => {
    expect(BADGES.map((b) => b.id)).toEqual([
      "streak_3", "streak_7", "streak_30", "streak_100", "streak_365",
      "movies_10", "movies_50", "movies_100", "movies_250", "movies_500",
      "letterboxd_import", "first_friend",
    ]);
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
  it("thresholds agree with the ids", () => {
    for (const b of BADGES) {
      const n = Number(b.id.split("_")[1]);
      expect(b.threshold).toBe(Number.isNaN(n) ? null : n);
    }
  });
});

describe("badgeProgress", () => {
  const stats = parseUserStats({ currentStreak: 5, totalMoviesRated: 60, earnedBadges: ["streak_3", "movies_10", "movies_50"], badgeEarnedDates: { streak_3: "2026-03-02" } });
  const by = (id: string) => BADGES.find((b) => b.id === id)!;

  it("tracks the current streak for streak badges and total rated for film badges", () => {
    expect(badgeProgress(by("streak_7"), stats)).toMatchObject({ earned: false, current: 5, unit: "day streak" });
    expect(badgeProgress(by("movies_100"), stats)).toMatchObject({ earned: false, current: 60, unit: "films rated" });
  });
  it("caps progress at the threshold and reports earned badges with their date", () => {
    expect(badgeProgress(by("streak_3"), stats)).toMatchObject({ earned: true, earnedDate: "2026-03-02", current: 3 });
  });
  it("has no numeric progress for achievements", () => {
    expect(badgeProgress(by("first_friend"), stats)).toMatchObject({ earned: false, current: null, unit: null });
  });
});

describe("formatBadgeDate", () => {
  it("formats the stored UTC day without shifting it", () => {
    expect(formatBadgeDate("2026-03-02")).toBe("March 2, 2026");
    expect(formatBadgeDate("2026-01-01")).toBe("January 1, 2026");
  });
  it("returns null for anything malformed", () => {
    for (const bad of [null, "", "yesterday", "2026-13-40", "2026/03/02"]) expect(formatBadgeDate(bad as string | null)).toBeNull();
  });
});
