// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WatchLaterItem } from "../../../core/models/WatchLaterItem";

const loadUserCollections = vi.fn();
const recordWatched = vi.fn();
const removeWatchLater = vi.fn();
const recordStreakInteraction = vi.fn();

vi.mock("../../../core/services/streak", () => ({ recordStreakInteraction: (...a: unknown[]) => recordStreakInteraction(...a) }));
vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  recordWatched: (...a: unknown[]) => recordWatched(...a),
  removeWatchLater: (...a: unknown[]) => removeWatchLater(...a),
}));

import { useWatchLater } from "./useWatchLater";

const item = (id: number, day: number): WatchLaterItem => ({
  movieId: id, title: `Movie ${id}`, posterPath: `/p${id}.jpg`, voteAverage: 7, releaseDate: "2020-01-01", addedAt: new Date(2026, 0, day),
});
const ref = (id: number) => ({ id, title: `Movie ${id}`, posterPath: `/p${id}.jpg` });
const toast = vi.fn();

async function setup() {
  const hook = renderHook(() => useWatchLater("u1", toast));
  await waitFor(() => expect(hook.result.current.phase).toBe("ready"));
  return hook;
}

describe("useWatchLater", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadUserCollections.mockResolvedValue({ watchLater: [item(2, 5), item(1, 1)] });
    recordWatched.mockResolvedValue(undefined);
    removeWatchLater.mockResolvedValue(undefined);
    recordStreakInteraction.mockResolvedValue({ kind: "skipped" });
  });

  it("loads the saved movies", async () => {
    const { result } = await setup();
    expect(result.current.items.map((i) => i.movieId)).toEqual([2, 1]);
  });

  it("reports a load failure", async () => {
    loadUserCollections.mockRejectedValue(new Error("offline"));
    const hook = renderHook(() => useWatchLater("u1", toast));
    await waitFor(() => expect(hook.result.current.phase).toBe("error"));
  });

  it("removes a movie and keeps it removed", async () => {
    const { result } = await setup();
    await act(() => result.current.remove(2));
    expect(removeWatchLater).toHaveBeenCalledWith("u1", 2);
    expect(result.current.items.map((i) => i.movieId)).toEqual([1]);
  });

  it("puts a movie back in its place when removing fails", async () => {
    removeWatchLater.mockRejectedValue(new Error("denied"));
    const { result } = await setup();
    await act(() => result.current.remove(2));
    expect(result.current.items.map((i) => i.movieId)).toEqual([2, 1]);
    expect(toast).toHaveBeenCalledWith("error", expect.any(String));
  });

  it("marks watched with the rating, clears the list entry and counts the streak", async () => {
    const { result } = await setup();
    await act(() => result.current.markWatched(ref(1), 4.5));
    expect(recordWatched).toHaveBeenCalledWith("u1", ref(1), 4.5, { dismissed: false, inWatchLater: true });
    expect(result.current.items.map((i) => i.movieId)).toEqual([2]);
    expect(recordStreakInteraction).toHaveBeenCalledWith("u1");
  });

  it("restores the movie and skips the streak when the rating fails to save", async () => {
    recordWatched.mockRejectedValue(new Error("denied"));
    const { result } = await setup();
    await act(() => result.current.markWatched(ref(1), 4));
    expect(result.current.items.map((i) => i.movieId)).toEqual([2, 1]);
    expect(recordStreakInteraction).not.toHaveBeenCalled();
  });
});
