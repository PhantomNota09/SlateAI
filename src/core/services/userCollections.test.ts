import { beforeEach, describe, expect, it, vi } from "vitest";

const batchSet = vi.fn();
const batchDelete = vi.fn();
const commit = vi.fn();
const getDocs = vi.fn();
const deleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, ...path: string[]) => path.join("/"),
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  getDocs: (ref: string) => getDocs(ref),
  deleteDoc: (ref: string) => deleteDoc(ref),
  serverTimestamp: () => "SERVER_TS",
  writeBatch: () => ({ set: batchSet, delete: batchDelete, commit }),
}));
vi.mock("./firebase", () => ({ db: {} }));

import {
  loadUserCollections,
  recordDismissed,
  recordWatchLater,
  recordWatched,
  removeWatchLater,
} from "./userCollections";

const movie = { id: 550, title: "Fight Club", posterPath: "/p.jpg" };

beforeEach(() => {
  vi.clearAllMocks();
  commit.mockResolvedValue(undefined);
});

describe("recordWatched", () => {
  it("writes the watched doc and clears dismissed + watch later in one batch", async () => {
    await recordWatched("u1", movie, 4.5, { dismissed: true, inWatchLater: true });
    expect(batchDelete.mock.calls.map((c) => c[0]).sort()).toEqual([
      "users/u1/dismissedRecommendations/550",
      "users/u1/watchLater/550",
    ]);
    expect(batchSet).toHaveBeenCalledWith("users/u1/watchedRecommendations/550", {
      movieId: 550,
      title: "Fight Club",
      posterPath: "/p.jpg",
      rating: 4.5,
      watchedAt: "SERVER_TS",
    });
    expect(commit).toHaveBeenCalledOnce();
  });

  it("does not delete anything the movie wasn't in", async () => {
    await recordWatched("u1", movie, 3, { dismissed: false, inWatchLater: false });
    expect(batchDelete).not.toHaveBeenCalled();
  });

  it("rejects ratings iOS can't produce, before writing anything", async () => {
    for (const bad of [0, 0.25, 5.5, -1, NaN]) {
      await expect(recordWatched("u1", movie, bad, { dismissed: false, inWatchLater: false })).rejects.toThrow();
    }
    expect(commit).not.toHaveBeenCalled();
  });
});

describe("recordDismissed", () => {
  it("stores the reason with a null customReason, like iOS", async () => {
    await recordDismissed("u1", movie, "Too long", { inWatchLater: false });
    expect(batchSet).toHaveBeenCalledWith("users/u1/dismissedRecommendations/550", {
      movieId: 550,
      title: "Fight Club",
      posterPath: "/p.jpg",
      reason: "Too long",
      customReason: null,
      dismissedAt: "SERVER_TS",
    });
    expect(batchDelete).not.toHaveBeenCalled();
  });

  it("removes the movie from watch later if it was saved", async () => {
    await recordDismissed("u1", movie, "Looks boring", { inWatchLater: true });
    expect(batchDelete).toHaveBeenCalledWith("users/u1/watchLater/550");
  });
});

describe("recordWatchLater / removeWatchLater", () => {
  it("saves the watch-later fields iOS reads and undismisses if needed", async () => {
    await recordWatchLater("u1", { ...movie, voteAverage: 8.4, releaseDate: "1999-10-15" }, { dismissed: true });
    expect(batchDelete).toHaveBeenCalledWith("users/u1/dismissedRecommendations/550");
    expect(batchSet).toHaveBeenCalledWith("users/u1/watchLater/550", {
      movieId: 550,
      title: "Fight Club",
      posterPath: "/p.jpg",
      voteAverage: 8.4,
      releaseDate: "1999-10-15",
      addedAt: "SERVER_TS",
    });
  });

  it("deletes only the watch-later doc", async () => {
    await removeWatchLater("u1", 550);
    expect(deleteDoc).toHaveBeenCalledWith("users/u1/watchLater/550");
  });
});

describe("loadUserCollections", () => {
  const ts = (ms: number) => ({ toDate: () => new Date(ms) });
  const docSnap = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });

  it("returns newest first, keeps entries that lack a timestamp, and falls back to the doc id", async () => {
    getDocs.mockImplementation(async (ref: string) => {
      if (ref.endsWith("watchedRecommendations"))
        return { docs: [docSnap("1", { movieId: 1, title: "old", rating: 3, watchedAt: ts(1000) }), docSnap("2", { movieId: 2, title: "new", rating: 5, watchedAt: ts(9000) })] };
      if (ref.endsWith("watchLater")) return { docs: [docSnap("77", { title: "no ts or movieId" })] };
      if (ref.endsWith("letterboxdData")) return { docs: [docSnap("9", { movieId: 9 }), docSnap("10", {})] };
      return { docs: [] };
    });
    const c = await loadUserCollections("u1");
    expect(c.watched.map((w) => w.movieId)).toEqual([2, 1]);
    expect(c.watchLater).toHaveLength(1);
    expect(c.watchLater[0].movieId).toBe(77);
    expect(c.letterboxdIds).toEqual([9, 10]);
    expect(c.dismissed).toEqual([]);
  });
});
