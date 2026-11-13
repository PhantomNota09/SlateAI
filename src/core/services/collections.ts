import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { parseFranchisePayload, type FranchisePayload } from "../models/Franchise";

// Franchise data comes from the `getCollections` callable (backend docs/COLLECTIONS.md): resolved
// against TMDb once on the server and cached there for 7 days. The last payload is kept in
// localStorage with its `version`, so reopening the tab is instant and a check costs a few bytes.
const CACHE_KEY = "slate.collections.v1";
const CALL_TIMEOUT_MS = 60_000; // the first call after a cold cache builds it (about 6 s, longer on a slow day)

type Response = { notModified: true; version: string } | { version: string; franchises: unknown[] };

export function readCachedFranchises(): FranchisePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? parseFranchisePayload(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeCache(raw: unknown) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(raw));
  } catch {
    // Storage full or blocked: the tab just loads from the network next time.
  }
}

// `null` means the cached copy (knownVersion) is still current. `refresh` is for an explicit
// "Refresh" tap only: the server rate-limits it and otherwise answers with its cached payload.
export async function fetchFranchises(knownVersion?: string, refresh = false): Promise<FranchisePayload | null> {
  const call = httpsCallable<{ knownVersion?: string; refresh?: boolean }, Response>(functions, "getCollections", { timeout: CALL_TIMEOUT_MS });
  const { data } = await call({ ...(knownVersion ? { knownVersion } : {}), ...(refresh ? { refresh: true } : {}) });
  if ("notModified" in data && data.notModified) return null;
  const payload = parseFranchisePayload(data);
  if (!payload) throw new Error("getCollections returned an unreadable payload");
  writeCache(data);
  return payload;
}

// users/{uid}.collectionWatchedMovies is client-owned (the server never touches it). arrayUnion
// adds without rewriting the list, so a second device's marks are never overwritten.
export async function addCollectionWatched(uid: string, movieId: number): Promise<void> {
  await updateDoc(doc(db, "users", uid), { collectionWatchedMovies: arrayUnion(movieId) });
}
