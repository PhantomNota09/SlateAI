import { beforeEach, describe, expect, it, vi } from "vitest";

const getDoc = vi.fn();
const setDoc = vi.fn();
const commit = vi.fn();
const batchSet = vi.fn();
const batchUpdate = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  getDoc: (ref: string) => getDoc(ref),
  setDoc: (...args: unknown[]) => setDoc(...args),
  writeBatch: () => ({ set: batchSet, update: batchUpdate, commit }),
}));
vi.mock("./firebase", () => ({ db: {} }));

import {
  claimUsername,
  createProfileWithoutUsername,
  ensureUserDocuments,
  getProfileStatus,
} from "./firestore";

const params = { uid: "u1", name: "Sam", email: "s@x.com", username: "sam" };
const snap = (exists: boolean, data: Record<string, unknown> = {}) => ({
  exists: () => exists,
  data: () => data,
});

beforeEach(() => {
  vi.clearAllMocks();
  commit.mockResolvedValue(undefined);
});

describe("getProfileStatus", () => {
  it("is missing without a users doc", async () => {
    getDoc.mockResolvedValue(snap(false));
    expect(await getProfileStatus("u1")).toBe("missing");
  });
  it("needs a username when the field is empty", async () => {
    getDoc.mockResolvedValue(snap(true, { username: " " }));
    expect(await getProfileStatus("u1")).toBe("needs-username");
  });
  it("is ready once a username is set", async () => {
    getDoc.mockResolvedValue(snap(true, { username: "sam" }));
    expect(await getProfileStatus("u1")).toBe("ready");
  });
});

describe("ensureUserDocuments", () => {
  it("writes nothing when users/{uid} already exists", async () => {
    getDoc.mockImplementation(async (ref: string) => snap(ref === "users/u1"));
    expect(await ensureUserDocuments(params)).toBe("exists");
    expect(batchSet).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it("writes nothing when the username is taken", async () => {
    getDoc.mockImplementation(async (ref: string) => snap(ref === "usernames/sam"));
    expect(await ensureUserDocuments(params)).toBe("username-taken");
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits the username claim and profile in one batch, without seeding userStats", async () => {
    getDoc.mockResolvedValue(snap(false));
    expect(await ensureUserDocuments(params)).toBe("created");
    expect(batchSet.mock.calls.map((c) => c[0])).toEqual(["usernames/sam", "users/u1"]); // no userStats: the function creates the full doc
    const userDoc = batchSet.mock.calls[1][1];
    expect(userDoc).toMatchObject({ onboardingStep: 1, hasCompletedProfile: true, username: "sam" });
    expect(commit).toHaveBeenCalledOnce();
  });

  it("reports username-taken when a concurrent claim beats us to the username", async () => {
    let usernameReads = 0;
    getDoc.mockImplementation(async (ref: string) =>
      ref === "usernames/sam" ? snap(++usernameReads > 1) : snap(false), // free at first, taken by the re-check
    );
    commit.mockRejectedValue({ code: "permission-denied" });
    expect(await ensureUserDocuments(params)).toBe("username-taken");
  });
});

describe("createProfileWithoutUsername", () => {
  it("never overwrites an existing profile", async () => {
    getDoc.mockResolvedValue(snap(true, { username: "sam" }));
    expect(await createProfileWithoutUsername(params)).toBe("exists");
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("creates an iOS-shaped social profile with an empty username", async () => {
    getDoc.mockResolvedValue(snap(false));
    expect(await createProfileWithoutUsername(params)).toBe("created");
    expect(setDoc.mock.calls[0][1]).toMatchObject({
      username: "",
      onboardingStep: 1,
      isOnboarded: false,
      hasCompletedProfile: true,
    });
  });

  it("leaves hasCompletedProfile false without a usable name or email", async () => {
    getDoc.mockResolvedValue(snap(false));
    await createProfileWithoutUsername({ uid: "u1", name: "", email: "" });
    expect(setDoc.mock.calls[0][1]).toMatchObject({ name: "User", hasCompletedProfile: false });
  });
});

// iOS decodes these fields strictly: an empty or unknown string makes the whole users/{uid}
// document undecodable in the iOS app. Raw values copied from UserPreferences.swift.
describe("new profile documents stay decodable by iOS", () => {
  const IOS_ENUMS: Record<string, string[]> = {
    storyPreference: ["Plot-driven", "Character-driven", "Visual spectacle", "Dialogue-heavy", "Mix of all"],
    tonePreference: ["Dark/Serious", "Light/Comedic", "Mix of both"],
    pacingPreference: ["Slow-burn", "Fast-paced", "Doesn't matter"],
    subtitlePreference: ["Love them", "Don't mind", "Prefer dubbed", "Avoid foreign films"],
    watchingWith: ["Alone", "With partner", "With family", "With friends"],
    attentionLevel: ["Full focus", "Background watching", "Multitasking"],
    releasePreference: ["Only new releases", "Mix of new and old", "Love classics"],
    foreignFilmPreference: ["Actively seek", "Open to", "Rarely watch"],
    runtimePreference: ["~90 min", "~2 hours", "2.5+ hours", "Doesn't matter"],
  };

  it.each(["setDoc", "batch"] as const)("uses valid iOS enum values (%s path)", async (path) => {
    getDoc.mockResolvedValue(snap(false));
    let payload: Record<string, unknown>;
    if (path === "setDoc") {
      await createProfileWithoutUsername(params);
      payload = setDoc.mock.calls[0][1];
    } else {
      await ensureUserDocuments(params);
      payload = batchSet.mock.calls[1][1];
    }
    for (const [field, allowed] of Object.entries(IOS_ENUMS)) {
      expect(allowed, field).toContain(payload[field]);
    }
    expect(payload).toMatchObject({
      maxViolenceLevel: 5,
      maxSexualContent: 5,
      maxSessionMinutes: 180,
      oldestAcceptableYear: 1970,
      rottenTomatoesThreshold: 70,
      imdbThreshold: 6.0,
    });
  });
});

describe("claimUsername", () => {
  it("does nothing if the profile already has a username", async () => {
    getDoc.mockResolvedValue(snap(true, { username: "old" }));
    expect(await claimUsername(params)).toBe("already-set");
    expect(commit).not.toHaveBeenCalled();
  });

  it("does nothing without a profile", async () => {
    getDoc.mockResolvedValue(snap(false));
    expect(await claimUsername(params)).toBe("missing-profile");
    expect(commit).not.toHaveBeenCalled();
  });

  it("does not write when the username is taken", async () => {
    getDoc.mockImplementation(async (ref: string) =>
      ref === "users/u1" ? snap(true, { username: "" }) : snap(true),
    );
    expect(await claimUsername(params)).toBe("username-taken");
    expect(commit).not.toHaveBeenCalled();
  });

  it("updates only the username on users/{uid}, and mirrors it into an existing userStats doc", async () => {
    getDoc.mockImplementation(async (ref: string) =>
      ref === "users/u1" ? snap(true, { username: "" }) : ref === "userStats/u1" ? snap(true) : snap(false),
    );
    expect(await claimUsername(params)).toBe("claimed");
    expect(batchUpdate).toHaveBeenCalledWith("users/u1", { username: "sam" });
    expect(batchUpdate).toHaveBeenCalledWith("userStats/u1", { username: "sam", displayName: "Sam" });
    expect(batchSet.mock.calls.map((c) => c[0])).toEqual(["usernames/sam"]);
  });

  it("never creates userStats: no stats doc means no stats write", async () => {
    getDoc.mockImplementation(async (ref: string) => (ref === "users/u1" ? snap(true, { username: "" }) : snap(false)));
    expect(await claimUsername(params)).toBe("claimed");
    expect(batchUpdate.mock.calls.map((c) => c[0])).toEqual(["users/u1"]);
    expect(batchSet.mock.calls.map((c) => c[0])).toEqual(["usernames/sam"]);
  });
});

// Denials while claiming a username: only a lost race should read as "taken".
describe("username claim failures", () => {
  const denied = { code: "permission-denied" };
  function mockUsernameLookups(takenOnRecheck: boolean) {
    let usernameReads = 0;
    getDoc.mockImplementation(async (ref: string) => {
      if (ref === "usernames/sam") return snap(++usernameReads > 1 && takenOnRecheck);
      return snap(false);
    });
  }

  it("reports username-taken when the denial was a lost username race", async () => {
    mockUsernameLookups(true);
    commit.mockRejectedValue(denied);
    expect(await ensureUserDocuments(params)).toBe("username-taken");
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("throws instead of blaming the username when it is still free", async () => {
    mockUsernameLookups(false);
    commit.mockRejectedValue(denied);
    await expect(ensureUserDocuments(params)).rejects.toMatchObject({ code: "permission-denied" });
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("does not treat a network failure as a taken username", async () => {
    mockUsernameLookups(false);
    commit.mockRejectedValue({ code: "unavailable" });
    await expect(ensureUserDocuments(params)).rejects.toMatchObject({ code: "unavailable" });
  });

  it("claimUsername handles a lost race the same way", async () => {
    let usernameReads = 0;
    getDoc.mockImplementation(async (ref: string) =>
      ref === "users/u1" ? snap(true, { username: "" }) : snap(ref === "usernames/sam" && ++usernameReads > 1),
    );
    commit.mockRejectedValue(denied);
    expect(await claimUsername(params)).toBe("username-taken");
  });
});
