import { beforeEach, describe, expect, it, vi } from "vitest";

const update = vi.fn();
let statsDoc: { exists: boolean; data: Record<string, unknown> };

vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      get: async () => ({ exists: () => statsDoc.exists, data: () => statsDoc.data }),
      update: (...args: unknown[]) => update(...args),
    }),
}));
vi.mock("./firebase", () => ({ db: {} }));

import { recordStreakInteraction } from "./streak";
import { describeStreakResult } from "../streak/streakMessages";

const NOW = new Date("2026-09-29T15:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  statsDoc = { exists: true, data: {} };
});

describe("recordStreakInteraction", () => {
  it("writes only the allowed streak fields, on the user's own userStats doc", async () => {
    statsDoc.data = { lastInteractionDate: "2026-09-28", currentStreak: 2, longestStreak: 2, moviesRated: 40, avgRating: 4.1 };
    const r = await recordStreakInteraction("u1", NOW);
    expect(r).toEqual({ kind: "extended", streak: 3, badgeId: "streak_3" });
    expect(update).toHaveBeenCalledTimes(1);
    const [path, fields] = update.mock.calls[0];
    expect(path).toBe("userStats/u1");
    expect(Object.keys(fields).sort()).toEqual(["badgeEarnedDates", "currentStreak", "earnedBadges", "lastInteractionDate", "longestStreak"]);
    expect(fields).not.toHaveProperty("moviesRated"); // Cloud-Function-owned fields are never touched
  });

  it("writes nothing when today is already counted", async () => {
    statsDoc.data = { lastInteractionDate: "2026-09-29", currentStreak: 5 };
    expect(await recordStreakInteraction("u1", NOW)).toEqual({ kind: "already" });
    expect(update).not.toHaveBeenCalled();
  });

  it("never tries to create userStats (the rules forbid client creates)", async () => {
    statsDoc = { exists: false, data: {} };
    expect(await recordStreakInteraction("u1", NOW)).toEqual({ kind: "skipped" });
    expect(update).not.toHaveBeenCalled();
  });

  it("swallows failures so they can never break an action", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    update.mockImplementationOnce(() => { throw new Error("permission-denied"); });
    statsDoc.data = { lastInteractionDate: "2026-09-28", currentStreak: 1 };
    expect(await recordStreakInteraction("u1", NOW)).toEqual({ kind: "failed" });
  });
});

describe("describeStreakResult", () => {
  it("stays quiet for anything that isn't news", () => {
    for (const kind of ["already", "skipped", "failed"] as const) expect(describeStreakResult({ kind })).toBeNull();
  });
  it("announces streak progress", () => {
    expect(describeStreakResult({ kind: "extended", streak: 6, badgeId: null })).toBe("6-day streak");
    expect(describeStreakResult({ kind: "first", streak: 1, badgeId: null })).toMatch(/started/i);
    expect(describeStreakResult({ kind: "reset", streak: 1, badgeId: null })).toMatch(/new streak/i);
  });
  it("prefers a newly earned badge, by its real name", () => {
    expect(describeStreakResult({ kind: "extended", streak: 7, badgeId: "streak_7" })).toBe("Badge unlocked: Weekly Matinee");
  });
});
