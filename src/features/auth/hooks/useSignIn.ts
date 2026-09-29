import { useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAdditionalUserInfo,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  deleteUser,
  type AuthError,
} from "firebase/auth";
import { auth, googleProvider } from "../../../core/services/firebase";
import { getProfileStatus } from "../../../core/services/firestore";

export const NO_ACCOUNT_MESSAGE = "No account found. Please sign up first.";

function messageFor(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "Something went wrong signing in. Please try again.";
  }
}

export function useSignIn() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Remember me": keep the session across browser restarts, or only for this tab.
  async function applyPersistence(remember: boolean) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  }

  async function signInWithEmail(email: string, password: string, remember: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await applyPersistence(remember);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(messageFor(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  // Mirrors iOS: signing in with Google never creates an account. If there's no
  // users/{uid} doc, report "no-account". A user created by this very click is removed
  // (nothing else can be attached to it); an existing auth user is only signed out.
  async function signInWithGoogle(remember: boolean): Promise<"ok" | "no-account"> {
    setSubmitting(true);
    setError(null);
    try {
      await applyPersistence(remember);
      const credential = await signInWithPopup(auth, googleProvider);
      if ((await getProfileStatus(credential.user.uid)) !== "missing") return "ok";

      if (getAdditionalUserInfo(credential)?.isNewUser) {
        await deleteUser(credential.user).catch(() => signOut(auth));
      } else {
        await signOut(auth);
      }
      setError(NO_ACCOUNT_MESSAGE);
      return "no-account";
    } catch (err) {
      setError(messageFor(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return { signInWithEmail, signInWithGoogle, submitting, error };
}
