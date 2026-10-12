import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";

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
