// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Movie } from "../../../core/models/Movie";
import type { UserCollections } from "../../../core/services/userCollections";

const getRecommendations = vi.fn();
const readProfile = vi.fn();
const loadUserCollections = vi.fn();
const recordWatched = vi.fn();
const recordDismissed = vi.fn();
const recordWatchLater = vi.fn();
const removeWatchLater = vi.fn();
const recordStreakInteraction = vi.fn();

vi.mock("../../../core/services/cloudFunctions", () => ({ getRecommendations: (...a: unknown[]) => getRecommendations(...a) }));
vi.mock("../../../core/services/firestore", () => ({ readProfile: (...a: unknown[]) => readProfile(...a) }));
vi.mock("../../../core/services/streak", () => ({ recordStreakInteraction: (...a: unknown[]) => recordStreakInteraction(...a) }));
vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  recordWatched: (...a: unknown[]) => recordWatched(...a),
  recordDismissed: (...a: unknown[]) => recordDismissed(...a),
  recordWatchLater: (...a: unknown[]) => recordWatchLater(...a),
  removeWatchLater: (...a: unknown[]) => removeWatchLater(...a),
}));

const startGenreBackfill = vi.fn();
vi.mock("../startGenreBackfill", () => ({ startGenreBackfill: (...a: unknown[]) => startGenreBackfill(...a) }));

import { useRecommendations } from "./useRecommendations";

const movie = (id: number): Movie => ({
  id, title: `Movie ${id}`, overview: "", posterPath: `/p${id}.jpg`, backdropPath: null,
  releaseDate: "2020-01-01", voteAverage: 7, genreIds: [], originalLanguage: "en", runtime: null, matchPercentage: 55, reasons: ["Matches your love of Action"],
});
const pool = (n: number, start = 1) => Array.from({ length: n }, (_, i) => movie(start + i));
const ref = (id: number) => ({ id, title: `Movie ${id}`, posterPath: `/p${id}.jpg` });

let collections: UserCollections;
const toast = vi.fn();

async function setup(poolSize = 10) {
  getRecommendations.mockResolvedValue({ pool: pool(poolSize) });
  const hook = renderHook(() => useRecommendations("u1", toast));
  await waitFor(() => expect(hook.result.current.phase).toBe("ready"));
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  collections = { watched: [], dismissed: [], watchLater: [], letterboxdIds: [], letterboxdMovies: [] };
  loadUserCollections.mockImplementation(async () => structuredClone(collections));
  readProfile.mockResolvedValue({ status: "ready", isOnboarded: true, preferences: { topGenres: [28] } });
  for (const fn of [recordWatched, recordDismissed, recordWatchLater, removeWatchLater]) fn.mockResolvedValue(undefined);
  recordStreakInteraction.mockResolvedValue({ kind: "extended", streak: 4, badgeId: null });
});

describe("loading", () => {
  it("shows the first movie and never queues movies the user already handled", async () => {
    collections.watched = [{ movieId: 1, title: "", posterPath: null, rating: 4, watchedAt: new Date() }];
    collections.watchLater = [{ movieId: 2, title: "", posterPath: null, voteAverage: 7, releaseDate: null, addedAt: new Date() }];
    const { result } = await setup();
    expect(result.current.current?.id).toBe(3);
    expect(result.current.watchLater).toHaveLength(1);
  });

  it("sends your ratings with genres to the engine, and starts the one-time genre fill-in from what it loaded", async () => {
    collections.watched = [{ movieId: 7, title: "Rated", posterPath: null, rating: 4.5, watchedAt: new Date(5), genreIds: [27] }];
    await setup();
    const request = getRecommendations.mock.calls[0][0];
    expect(request.ratedHistory).toEqual([{ movieId: 7, rating: 4.5, genreIds: [27] }]);
    expect(startGenreBackfill).toHaveBeenCalledWith("u1", expect.objectContaining({ watched: collections.watched }));
  });

  it("reports an error phase when the function call fails", async () => {
    getRecommendations.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderHook(() => useRecommendations("u1", toast));
    await waitFor(() => expect(result.current.phase).toBe("error"));
  });
});

describe("error handling (spec §3 error codes)", () => {
  it("shows a TMDb-outage message, not an empty state, on `unavailable`", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getRecommendations.mockRejectedValue({ code: "functions/unavailable" });
    const { result } = renderHook(() => useRecommendations("u1", toast));
    await waitFor(() => expect(result.current.phase).toBe("error"));
    expect(result.current.error).toMatch(/temporarily unavailable/i);
  });

  it("explains rate limiting with the retry delay", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    getRecommendations.mockRejectedValue({ code: "functions/resource-exhausted", details: { retryAfterSeconds: 12 } });
    const { result } = renderHook(() => useRecommendations("u1", toast));
    await waitFor(() => expect(result.current.phase).toBe("error"));
    expect(result.current.error).toMatch(/12 seconds/);
  });

  it("surfaces a failed refill instead of leaving the feed loading forever", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup(2); // tiny pool: queue is already below the refill threshold
    getRecommendations.mockRejectedValue({ code: "functions/unavailable" });
    await act(async () => { result.current.skip(result.current.current!); });
    await act(async () => { result.current.skip(result.current.current!); });
    await waitFor(() => expect(result.current.refillFailed).toBe(true));
    expect(result.current.current).toBeNull();
    expect(result.current.refillError).toMatch(/temporarily unavailable/i);
  });

  it("keeps an empty successful response as 'seen them all', not an error", async () => {
    getRecommendations.mockResolvedValue({ pool: [] });
    const { result } = renderHook(() => useRecommendations("u1", toast));
    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(result.current.current).toBeNull();
    expect(result.current.exhausted).toBe(true);
    expect(result.current.refillFailed).toBe(false);
  });
});

describe("skip", () => {
  it("advances without writing anything (skips are session-only, like iOS)", async () => {
    const { result } = await setup();
    act(() => result.current.skip(result.current.current!));
    expect(result.current.current?.id).toBe(2);
    for (const fn of [recordWatched, recordDismissed, recordWatchLater, removeWatchLater]) expect(fn).not.toHaveBeenCalled();
  });
});

describe("markWatched", () => {
  it("updates instantly, then writes with the right context flags", async () => {
    collections.dismissed = [{ movieId: 1, title: "", posterPath: null, reason: "Too long", customReason: null, dismissedAt: new Date() }];
    const { result } = await setup(); // movie 1 is filtered out (dismissed), so current is 2
    collections.dismissed = [];
    await act(async () => { await result.current.markWatched(ref(2), 4.5); });
    expect(recordWatched).toHaveBeenCalledWith("u1", ref(2), 4.5, { dismissed: false, inWatchLater: false });
    expect(result.current.current?.id).toBe(3);
    expect(toast).toHaveBeenCalledWith("success", expect.any(String));
  });

  it("restores the movie exactly where it was if the write fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup();
    recordWatched.mockRejectedValue(new Error("offline"));
    await act(async () => { await result.current.markWatched(ref(1), 3); });
    expect(result.current.current?.id).toBe(1);
    expect(toast).toHaveBeenCalledWith("error", expect.any(String));
  });
});

describe("dismiss", () => {
  it("writes the reason and removes the movie", async () => {
    const { result } = await setup();
    const first = result.current.current!;
    await act(async () => { await result.current.dismiss(first, "Looks boring"); });
    expect(recordDismissed).toHaveBeenCalledWith("u1", first, "Looks boring", { inWatchLater: false });
    expect(result.current.current?.id).toBe(2);
    expect(result.current.dismissedIds.has(first.id)).toBe(true);
  });

  it("rolls back a failed dismiss", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup();
    const first = result.current.current!;
    recordDismissed.mockRejectedValue(new Error("nope"));
    await act(async () => { await result.current.dismiss(first, "Too old"); });
    expect(result.current.current?.id).toBe(first.id);
    expect(result.current.dismissedIds.has(first.id)).toBe(false);
  });
});

describe("watch later", () => {
  it("saves and lists the movie, removing it from the feed", async () => {
    const { result } = await setup();
    const first = result.current.current!;
    await act(async () => { await result.current.saveForLater(first); });
    expect(recordWatchLater).toHaveBeenCalledWith("u1", first, { dismissed: false });
    expect(result.current.watchLater.map((w) => w.movieId)).toEqual([1]);
    expect(result.current.current?.id).toBe(2);
  });

  it("puts the movie back in the feed and out of the list if saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup();
    const first = result.current.current!;
    recordWatchLater.mockRejectedValue(new Error("nope"));
    await act(async () => { await result.current.saveForLater(first); });
    expect(result.current.current?.id).toBe(1);
    expect(result.current.watchLater).toHaveLength(0);
  });

  it("restores a removed item if the delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    collections.watchLater = [{ movieId: 99, title: "Saved", posterPath: null, voteAverage: 7, releaseDate: null, addedAt: new Date() }];
    const { result } = await setup();
    removeWatchLater.mockRejectedValue(new Error("nope"));
    await act(async () => { await result.current.removeFromWatchLater(99); });
    expect(result.current.watchLater.map((w) => w.movieId)).toEqual([99]);
  });
});

describe("refill", () => {
  it("fetches more when the queue runs short and does not duplicate movies", async () => {
    const { result } = await setup(7); // 7 queued, threshold is 6
    getRecommendations.mockResolvedValue({ pool: pool(10, 5) }); // ids 5-14; 5-7 overlap the queue
    await act(async () => { result.current.skip(result.current.current!); });
    await act(async () => { result.current.skip(result.current.current!); }); // 5 left -> refill
    await waitFor(() => expect(result.current.queueLength).toBeGreaterThan(5));
    expect(getRecommendations).toHaveBeenCalledTimes(2);
  });
});

// iOS (RecommendationCoordinator) counts rate, dismiss, watch-later and skip as the daily
// interaction; removing from watch later does not count.
describe("streak tracking", () => {
  it("counts a rating, with a streak toast", async () => {
    const { result } = await setup();
    await act(async () => { await result.current.markWatched(ref(1), 4); });
    await waitFor(() => expect(recordStreakInteraction).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("success", "4-day streak"));
  });

  it("counts dismiss, watch-later and skip", async () => {
    for (const act_ of ["dismiss", "saveForLater", "skip"] as const) {
      recordStreakInteraction.mockClear();
      const { result } = await setup();
      const first = result.current.current!;
      await act(async () => {
        if (act_ === "dismiss") await result.current.dismiss(first, "Too long");
        if (act_ === "saveForLater") await result.current.saveForLater(first);
        if (act_ === "skip") result.current.skip(first);
      });
      await waitFor(() => expect(recordStreakInteraction).toHaveBeenCalledTimes(1));
    }
  });

  it("does not count removing a movie from watch later", async () => {
    collections.watchLater = [{ movieId: 99, title: "Saved", posterPath: null, voteAverage: 7, releaseDate: null, addedAt: new Date() }];
    const { result } = await setup();
    await act(async () => { await result.current.removeFromWatchLater(99); });
    expect(recordStreakInteraction).not.toHaveBeenCalled();
  });

  it("does not count an action whose write failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup();
    recordWatched.mockRejectedValue(new Error("offline"));
    await act(async () => { await result.current.markWatched(ref(1), 3); });
    expect(recordStreakInteraction).not.toHaveBeenCalled();
  });

  it("checks only once per day per session, and retries after a failure", async () => {
    const { result } = await setup();
    await act(async () => { result.current.skip(result.current.current!); });
    await waitFor(() => expect(recordStreakInteraction).toHaveBeenCalledTimes(1));
    await act(async () => { result.current.skip(result.current.current!); });
    await act(async () => { result.current.skip(result.current.current!); });
    expect(recordStreakInteraction).toHaveBeenCalledTimes(1); // already counted today

    recordStreakInteraction.mockClear();
    recordStreakInteraction.mockResolvedValue({ kind: "failed" });
    const second = await setup();
    await act(async () => { second.result.current.skip(second.result.current.current!); });
    await waitFor(() => expect(recordStreakInteraction).toHaveBeenCalledTimes(1));
    await act(async () => { second.result.current.skip(second.result.current.current!); });
    await waitFor(() => expect(recordStreakInteraction).toHaveBeenCalledTimes(2)); // failed -> try again
  });

  it("never lets a streak failure disturb the action itself", async () => {
    recordStreakInteraction.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await setup();
    await act(async () => { await result.current.markWatched(ref(1), 5); });
    expect(result.current.current?.id).toBe(2);
    expect(toast).toHaveBeenCalledWith("success", "Marked as watched");
  });
});
