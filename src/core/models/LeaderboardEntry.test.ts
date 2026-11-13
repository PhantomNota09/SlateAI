import { describe, expect, it } from "vitest";
import { parseLeaderboardEntry, scoreOf } from "./LeaderboardEntry";

describe("scoreOf", () => {
  it("uses totalMoviesRated when present, else adds Slate and Letterboxd", () => {
    expect(scoreOf({ totalMoviesRated: 12, moviesRated: 1 })).toBe(12);
    expect(scoreOf({ moviesRated: 4, letterboxdMoviesRated: 6 })).toBe(10);
    expect(scoreOf({})).toBe(0);
  });
});

describe("parseLeaderboardEntry", () => {
  it("prefers the authoritative username and flags the current user", () => {
    const e = parseLeaderboardEntry("u1", { username: "stale", displayName: "Ada", totalMoviesRated: 3, topGenres: ["Drama", 5] }, 2, "u1", "ada_l");
    expect(e).toMatchObject({ rank: 2, username: "ada_l", displayName: "Ada", score: 3, topGenres: ["Drama"], isCurrentUser: true });
    expect(parseLeaderboardEntry("u2", { username: "bo" }, 1, "u1").username).toBe("bo");
  });
});
