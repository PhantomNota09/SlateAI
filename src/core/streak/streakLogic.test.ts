import { describe, expect, it } from "vitest";
import { computeStreak, utcDay, utcYesterday } from "./streakLogic";

const at = (iso: string) => new Date(iso);
const NOW = at("2026-09-29T15:30:00Z");

describe("UTC day helpers", () => {
  it("uses the UTC calendar day, not the local one", () => {
    expect(utcDay(at("2026-09-29T23:59:59Z"))).toBe("2026-09-29");
    expect(utcDay(at("2026-09-30T00:00:00Z"))).toBe("2026-09-30");
  });
  it("finds yesterday across month and year boundaries", () => {
    expect(utcYesterday(at("2026-03-01T10:00:00Z"))).toBe("2026-02-28");
    expect(utcYesterday(at("2026-01-01T00:00:00Z"))).toBe("2025-12-31");
    expect(utcYesterday(at("2028-03-01T10:00:00Z"))).toBe("2028-02-29"); // leap year
  });
});

describe("computeStreak (mirrors iOS StreakService.recordInteraction)", () => {
  it("is idempotent within a UTC day: no event, nothing to write", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-29", currentStreak: 4, longestStreak: 9 }, NOW);
    expect(r).toEqual({ event: { kind: "already" }, badgeId: null, update: null });
  });

  it("starts a streak on the first ever interaction", () => {
    const r = computeStreak({}, NOW);
    expect(r.event).toEqual({ kind: "first", streak: 1 });
    expect(r.update).toEqual({ currentStreak: 1, longestStreak: 1, lastInteractionDate: "2026-09-29" });
    expect(r.badgeId).toBeNull();
  });

  it("extends when the last interaction was yesterday", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-28", currentStreak: 4, longestStreak: 9 }, NOW);
    expect(r.event).toEqual({ kind: "extended", streak: 5 });
    expect(r.update).toMatchObject({ currentStreak: 5, longestStreak: 9, lastInteractionDate: "2026-09-29" });
  });

  it("raises the longest streak when the current one passes it", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-28", currentStreak: 9, longestStreak: 9 }, NOW);
    expect(r.update).toMatchObject({ currentStreak: 10, longestStreak: 10 });
  });

  it("resets to 1 after missing two or more days, keeping the longest", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-27", currentStreak: 12, longestStreak: 20 }, NOW);
    expect(r.event).toEqual({ kind: "reset", streak: 1, longestWas: 20 });
    expect(r.update).toMatchObject({ currentStreak: 1, longestStreak: 20 });
  });

  it("awards a streak badge exactly when the threshold is reached", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-28", currentStreak: 2, longestStreak: 2, earnedBadges: [], badgeEarnedDates: {} }, NOW);
    expect(r.badgeId).toBe("streak_3");
    expect(r.update).toMatchObject({ earnedBadges: ["streak_3"], badgeEarnedDates: { streak_3: "2026-09-29" } });
  });

  it("does not re-award a badge that is already earned and keeps existing badges and dates", () => {
    const r = computeStreak({
      lastInteractionDate: "2026-09-28", currentStreak: 5, longestStreak: 5,
      earnedBadges: ["streak_3", "movies_10"], badgeEarnedDates: { streak_3: "2026-08-01", movies_10: "2026-07-01" },
    }, NOW);
    expect(r.badgeId).toBeNull();
    expect(r.update).not.toHaveProperty("earnedBadges");
    expect(r.update).not.toHaveProperty("badgeEarnedDates");
  });

  it("appends to other badges and preserves their dates when a new one is earned", () => {
    const r = computeStreak({
      lastInteractionDate: "2026-09-28", currentStreak: 6, longestStreak: 6,
      earnedBadges: ["streak_3", "movies_10"], badgeEarnedDates: { streak_3: "2026-08-01", movies_10: "2026-07-01" },
    }, NOW);
    expect(r.badgeId).toBe("streak_7");
    expect(r.update?.earnedBadges).toEqual(["streak_3", "movies_10", "streak_7"]);
    expect(r.update?.badgeEarnedDates).toEqual({ streak_3: "2026-08-01", movies_10: "2026-07-01", streak_7: "2026-09-29" });
  });

  it("awards every missed threshold and reports the highest (iOS loops ascending)", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-28", currentStreak: 29, longestStreak: 29, earnedBadges: [] }, NOW);
    expect(r.update?.earnedBadges).toEqual(["streak_3", "streak_7", "streak_30"]);
    expect(r.badgeId).toBe("streak_30");
  });

  it("does not award a badge on a reset", () => {
    const r = computeStreak({ lastInteractionDate: "2026-09-20", currentStreak: 50, longestStreak: 50, earnedBadges: [] }, NOW);
    expect(r.badgeId).toBeNull();
  });

  it("only ever writes fields the security rules allow clients to update", () => {
    const allowed = new Set(["currentStreak", "longestStreak", "lastInteractionDate", "earnedBadges", "badgeEarnedDates"]);
    const cases = [{}, { lastInteractionDate: "2026-09-28", currentStreak: 2 }, { lastInteractionDate: "2026-01-01", currentStreak: 40 }];
    for (const data of cases) for (const k of Object.keys(computeStreak(data, NOW).update ?? {})) expect(allowed.has(k), k).toBe(true);
  });

  it("copes with malformed stored values instead of writing garbage", () => {
    const r = computeStreak({ lastInteractionDate: 5, currentStreak: "7", longestStreak: 3.5, earnedBadges: "streak_3", badgeEarnedDates: [1] }, NOW);
    expect(r.event.kind).toBe("first");
    expect(r.update).toMatchObject({ currentStreak: 1, longestStreak: 1 });
  });

  it("crosses UTC midnight correctly", () => {
    const beforeMidnight = at("2026-09-29T23:59:00Z");
    const afterMidnight = at("2026-09-30T00:01:00Z");
    const first = computeStreak({}, beforeMidnight);
    const second = computeStreak({ ...first.update }, afterMidnight);
    expect(second.event).toEqual({ kind: "extended", streak: 2 });
  });
});
