import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { updateDoc } from "firebase/firestore";
import type { NewUserPreferences, UserPreferences } from "../models/UserPreferences";

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "usernames", username));
  return !snap.exists();
}

function defaultUserPreferences(params: {
  name: string;
  email: string;
  username: string;
  hasCompletedProfile: boolean;
}): NewUserPreferences {
  // Every value below is iOS's default (UserPreferences.swift) — enum fields must be valid
  // raw values or the iOS app can't decode this document.
  return {
    name: params.name,
    email: params.email,
    username: params.username,
    avatarURL: "",

    topGenres: [],
    avoidGenres: [],

    storyPreference: "Mix of all",
    tonePreference: "Mix of both",
    pacingPreference: "Doesn't matter",

    favoriteThemes: [],

    maxViolenceLevel: 5,
    maxSexualContent: 5,

    preferredRatings: ["G", "PG", "PG-13", "R"],

    subtitlePreference: "Don't mind",

    watchingTimes: [],
    maxSessionMinutes: 180,
    watchingWith: "Alone",
    attentionLevel: "Full focus",

    rottenTomatoesThreshold: 70,
    imdbThreshold: 6.0,
    trustedReviewers: ["Rotten Tomatoes"],

    caresAbout: [],
    releasePreference: "Mix of new and old",
    oldestAcceptableYear: 1970,
    foreignFilmPreference: "Open to",

    preferredLanguages: [],

    ratedMovies: [],
    movieComparisons: [],

    favoriteActors: [],
    favoriteDirectors: [],
    guiltyPleasures: [],
    specificAvoidances: [],
    antiPatterns: [],

    topRecommendations: [],

    collectionWatchedMovies: [],

    runtimePreference: "Doesn't matter",
    rewatchBehavior: false,

    isOnboarded: false,
    onboardingStep: 1,
    hasCompletedTutorial: false,
    hasCompletedProfile: params.hasCompletedProfile,

    region: guessRegion(),

    preferredStreamingServices: [],
    streamingAvailabilityTypes: ["flatrate"],
  };
}

function guessRegion(): string {
  try {
    const locale = new Intl.Locale(navigator.language);
    return locale.region ?? "US";
  } catch {
    return "US";
  }
}

export type ProfileStatus = "missing" | "needs-username" | "ready";

export interface ProfileSnapshot {
  status: ProfileStatus;
  isOnboarded: boolean;
  preferences: Partial<UserPreferences> | null;
}

// Mirrors iOS `needsUsernameSetup`: a user doc with an empty username is gated until
// one is claimed, regardless of sign-in method. Throws on network/permission errors so
// callers can show a retry state instead of mistaking a failed read for "no profile".
export async function readProfile(uid: string): Promise<ProfileSnapshot> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return { status: "missing", isOnboarded: false, preferences: null };
  const data = snap.data() as Partial<UserPreferences>;
  const username = String(data.username ?? "").trim();
  return {
    status: username ? "ready" : "needs-username",
    isOnboarded: data.isOnboarded === true,
    preferences: data,
  };
}

export async function getProfileStatus(uid: string): Promise<ProfileStatus> {
  return (await readProfile(uid)).status;
}

// Onboarding writes only the fields it owns (never the whole document), so a stale copy
// in this tab can't overwrite changes made from iOS/Android in the meantime.
export type OnboardingFields = Pick<
  UserPreferences,
  | "preferredLanguages"
  | "topGenres"
  | "avoidGenres"
  | "releasePreference"
  | "oldestAcceptableYear"
  | "storyPreference"
  | "tonePreference"
  | "pacingPreference"
  | "runtimePreference"
  | "maxSessionMinutes"
  | "favoriteThemes"
>;

export async function saveOnboardingProgress(
  uid: string,
  fields: OnboardingFields,
  step: number,
  options: { complete?: boolean } = {},
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...fields,
    onboardingStep: step,
    ...(options.complete ? { isOnboarded: true } : {}),
  });
}

export type CreateResult = "created" | "exists";
export type EnsureUserResult = CreateResult | "username-taken";

// Creates users/{uid} only if it doesn't exist. Used for social sign-up and as the
// fallback when an email sign-up's username was taken (username claimed later).
// Same shape iOS writes for a first-time Google/Apple user: username "", onboarding
// step 1, hasCompletedProfile only when we got a real name and email from the provider.
export async function createProfileWithoutUsername(params: {
  uid: string;
  name: string;
  email: string;
}): Promise<CreateResult> {
  const ref = doc(db, "users", params.uid);
  if ((await getDoc(ref)).exists()) return "exists";
  const name = params.name.trim() || "User";
  const hasCompletedProfile = name !== "User" && params.email.trim() !== "";
  await setDoc(ref, defaultUserPreferences({ name, email: params.email, username: "", hasCompletedProfile }));
  return "created";
}

const isPermissionDenied = (err: unknown) => (err as { code?: string })?.code === "permission-denied";

// Commits a "claim username" batch. `build(withStats)` returns the batch with or without the
// userStats seed. iOS always includes the seed, so that's tried first. If Firestore denies it
// we can't tell a lost username race from a rules restriction on creating userStats, so:
//   - re-check the username; if it's now taken, report that;
//   - otherwise retry without the seed. The onUserCreated Cloud Function creates the full
//     userStats document (correct username/displayName, taken from users/{uid}) on its own,
//     so nothing is lost. A second denial with a free username is a real error and is thrown.
async function commitClaim(
  build: (withStats: boolean) => ReturnType<typeof writeBatch>,
  username: string,
): Promise<"ok" | "username-taken"> {
  try {
    await build(true).commit();
    return "ok";
  } catch (err) {
    if (!isPermissionDenied(err)) throw err;
  }
  if (!(await isUsernameAvailable(username))) return "username-taken";
  try {
    await build(false).commit();
    return "ok";
  } catch (err) {
    if (!isPermissionDenied(err)) throw err;
    if (!(await isUsernameAvailable(username))) return "username-taken";
    throw err;
  }
}

// Atomic three-write batch iOS does at email signup (spec §2 / CLAUDE.md "Auth"):
// claim usernames/{username}, create users/{uid}, seed userStats/{uid}.
//
// Safe for existing accounts: if users/{uid} already exists nothing is written. Must
// run while signed in — firestore.rules requires auth to read usernames. usernames
// updates are denied by the rules, so if someone claims the username between our
// check and the commit, the whole batch fails atomically ("username-taken"). See commitClaim
// for how a denied userStats seed is handled.
export async function ensureUserDocuments(params: {
  uid: string;
  name: string;
  email: string;
  username: string;
}): Promise<EnsureUserResult> {
  if ((await getDoc(doc(db, "users", params.uid))).exists()) return "exists";
  if (!(await isUsernameAvailable(params.username))) return "username-taken";

  const result = await commitClaim((withStats) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames", params.username), { userId: params.uid });
    batch.set(
      doc(db, "users", params.uid),
      defaultUserPreferences({ ...params, hasCompletedProfile: true }),
    );
    if (withStats) {
      batch.set(
        doc(db, "userStats", params.uid),
        { username: params.username, displayName: params.name },
        { merge: true },
      );
    }
    return batch;
  }, params.username);
  return result === "ok" ? "created" : "username-taken";
}

export type ClaimResult = "claimed" | "already-set" | "username-taken" | "missing-profile";

// Sets the username on an existing profile. Never replaces a username that's already
// set, and never touches any other field of users/{uid}.
export async function claimUsername(params: {
  uid: string;
  name: string;
  username: string;
}): Promise<ClaimResult> {
  const userRef = doc(db, "users", params.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return "missing-profile";
  if (String(snap.data().username ?? "").trim()) return "already-set";
  if (!(await isUsernameAvailable(params.username))) return "username-taken";

  const result = await commitClaim((withStats) => {
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames", params.username), { userId: params.uid });
    batch.update(userRef, { username: params.username });
    if (withStats) {
      batch.set(
        doc(db, "userStats", params.uid),
        { username: params.username, displayName: params.name },
        { merge: true },
      );
    }
    return batch;
  }, params.username);
  return result === "ok" ? "claimed" : "username-taken";
}
