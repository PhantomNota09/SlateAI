import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake Firestore that records every delete/update in order, so the sequence can be asserted.
const log: string[] = [];
const docs = new Map<string, { id: string; ref: { path: string }; data: () => Record<string, unknown> }[]>();
const ref = (path: string) => ({ path });

vi.mock("./firebase", () => ({ auth: {}, db: {}, googleProvider: {} }));
vi.mock("firebase/auth", () => ({
  deleteUser: vi.fn(async () => { log.push("auth:delete"); }),
  reauthenticateWithCredential: vi.fn(async () => { log.push("auth:reauth"); }),
  reauthenticateWithPopup: vi.fn(async () => { log.push("auth:reauth-popup"); }),
  EmailAuthProvider: { credential: vi.fn() },
  updatePassword: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...segs: string[]) => ref(segs.join("/")),
  collection: (_db: unknown, ...segs: string[]) => ({ path: segs.join("/") }),
  query: (c: { path: string }, ...clauses: string[]) => ({ path: c.path, key: `${c.path}?${clauses.join("&")}` }),
  where: (f: string, _op: string, v: string) => `${f}=${v}`,
  getDoc: async (r: { path: string }) => ({ data: () => (r.path === "users/u1" ? { username: "ada_l" } : undefined) }),
  getDocs: async (q: { path: string; key?: string }) => ({ docs: docs.get(q.key ?? q.path) ?? [] }),
  deleteDoc: async (r: { path: string }) => { log.push(`delete:${r.path}`); },
  writeBatch: () => {
    const ops: string[] = [];
    return {
      delete: (r: { path: string }) => ops.push(`delete:${r.path}`),
      update: (r: { path: string }, d: { status: string }) => ops.push(`update:${r.path}:${d.status}`),
      set: vi.fn(),
      commit: async () => { log.push(...ops); },
    };
  },
}));

import { deleteAccount, deleteAccountData } from "./account";

const entry = (path: string, id: string) => ({ id, ref: ref(path), data: () => ({}) });

beforeEach(() => {
  log.length = 0;
  docs.clear();
  docs.set("users/u1/watchedRecommendations", [entry("users/u1/watchedRecommendations/10", "10")]);
  docs.set("users/u1/friends", [entry("users/u1/friends/f1", "f1")]);
  docs.set("friendRequests?fromUID=u1", [entry("friendRequests/r1", "r1")]);
  docs.set("friendRequests?toUID=u1&status=pending", [entry("friendRequests/r2", "r2")]);
});

describe("deleteAccountData", () => {
  it("removes userStats first, then the user's data, and the user document last", async () => {
    await deleteAccountData("u1");
    expect(log[0]).toBe("delete:userStats/u1");
    expect(log).toContain("delete:users/u1/watchedRecommendations/10");
    expect(log).toContain("delete:users/u1/friends/f1");
    expect(log).toContain("delete:users/f1/friends/u1"); // the friend's side too
    expect(log).toContain("delete:friendRequests/r1"); // sent: deletable
    expect(log).toContain("update:friendRequests/r2:rejected"); // received: only declined (rules)
    expect(log).not.toContain("delete:friendRequests/r2");
    expect(log.slice(-2)).toEqual(["delete:usernames/ada_l", "delete:users/u1"]);
    expect(log.indexOf("delete:userStats/u1")).toBeLessThan(log.indexOf("delete:users/u1/watchedRecommendations/10"));
  });
});

describe("deleteAccount", () => {
  const user = { uid: "u1", email: "a@b.co" } as never;

  it("re-authenticates before touching any data, and deletes the Auth user last", async () => {
    await deleteAccount(user, "pw");
    expect(log[0]).toBe("auth:reauth");
    expect(log[1]).toBe("delete:userStats/u1");
    expect(log.at(-1)).toBe("auth:delete");
  });

  it("deletes nothing if re-authentication fails", async () => {
    const auth = await import("firebase/auth");
    vi.mocked(auth.reauthenticateWithCredential).mockRejectedValueOnce({ code: "auth/invalid-credential" });
    await expect(deleteAccount(user, "bad")).rejects.toBeTruthy();
    expect(log).toEqual([]);
  });

  it("does not delete the Auth user if a data delete fails", async () => {
    const fs = await import("firebase/firestore");
    vi.spyOn(fs, "deleteDoc").mockRejectedValueOnce(new Error("permission-denied"));
    await expect(deleteAccount(user, "pw")).rejects.toThrow();
    expect(log).not.toContain("auth:delete");
  });
});
