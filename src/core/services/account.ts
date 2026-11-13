import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, updatePassword, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, where, writeBatch, type DocumentReference } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

export const MAX_NAME_LENGTH = 50;

// Display name lives in two places: users/{uid}.name (the profile) and userStats/{uid}.displayName
// (what friends and search see). The rules let the client write both; one batch keeps them in step.
export async function updateDisplayName(uid: string, name: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { name });
  batch.set(doc(db, "userStats", uid), { displayName: name }, { merge: true });
  await batch.commit();
}

// Only accounts that sign in with a password have one to change (Google / Apple accounts don't).
export function hasPasswordSignIn(user: User | null): boolean {
  return !!user?.providerData.some((p) => p.providerId === "password");
}

// Firebase requires a recent sign-in to change a password, so the current one is checked first.
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No signed-in user with an email");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}

// ── Delete account ───────────────────────────────────────────────────────────────────────────
// Mirrors iOS AuthViewModel.deleteAccount, with three deliberate differences:
//  1. The user re-authenticates FIRST. iOS deletes all data and only then learns Firebase wants a recent
//     sign-in, which can leave a wiped profile on a live account. Here nothing is touched until that passes.
//  2. Failures stop the process (iOS logs and carries on), so the Auth user is only deleted once every
//     Firestore delete succeeded. Every step is safe to repeat, so the user can simply try again.
//  3. Friends' reciprocal entries are removed too, so nobody is left with a ghost friend.
// The Auth user goes last: once it is gone the security rules reject every other write.

const BATCH_SIZE = 450; // under Firestore's 500-writes-per-batch limit

// userStats goes first on purpose: the stats triggers do nothing when it is missing, so deleting the
// watched films afterwards can't recreate it (backend docs/WATCHED_STATS.md).
const SUBCOLLECTIONS = ["watchedRecommendations", "dismissedRecommendations", "watchLater", "metadata", "letterboxdData"] as const;

async function deleteAll(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_SIZE).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export async function reauthenticate(user: User, password?: string): Promise<void> {
  if (password !== undefined) {
    if (!user.email) throw new Error("No email on this account");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } else {
    await reauthenticateWithPopup(user, googleProvider);
  }
}

// Everything in Firestore that belongs to this user, in an order that is safe to retry part-way.
export async function deleteAccountData(uid: string): Promise<void> {
  // The username is read first: it lives on the user document, which is deleted near the end.
  const userSnap = await getDoc(doc(db, "users", uid));
  const username = String(userSnap.data()?.username ?? "").trim();

  await deleteDoc(doc(db, "userStats", uid));

  for (const name of SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, name));
    await deleteAll(snap.docs.map((d) => d.ref));
  }

  // Friends: your side and theirs (the rules let any signed-in user write friend entries).
  const friends = await getDocs(collection(db, "users", uid, "friends"));
  await deleteAll(friends.docs.flatMap((d) => [d.ref, doc(db, "users", d.id, "friends", uid)]));

  // Requests you sent can be deleted. The rules only let the SENDER delete a request, so requests you
  // received stay behind; the pending ones are declined so their senders stop seeing them as waiting.
  const sent = await getDocs(query(collection(db, "friendRequests"), where("fromUID", "==", uid)));
  await deleteAll(sent.docs.map((d) => d.ref));
  const received = await getDocs(query(collection(db, "friendRequests"), where("toUID", "==", uid), where("status", "==", "pending")));
  for (let i = 0; i < received.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    received.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.update(d.ref, { status: "rejected" }));
    await batch.commit();
  }

  if (username) await deleteDoc(doc(db, "usernames", username));
  await deleteDoc(doc(db, "users", uid));
}

// Re-authenticate (password, or Google when `password` is undefined), delete the data, then the Auth user.
export async function deleteAccount(user: User, password?: string): Promise<void> {
  await reauthenticate(user, password);
  await deleteAccountData(user.uid);
  await deleteUser(user);
}

export const providerOf = (user: User | null): "password" | "google" | "other" =>
  hasPasswordSignIn(user) ? "password" : user?.providerData.some((p) => p.providerId === "google.com") ? "google" : "other";
