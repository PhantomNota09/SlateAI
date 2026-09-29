import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { auth, googleProvider } from "../../../core/services/firebase";
import {
  createProfileWithoutUsername,
  ensureUserDocuments,
  getProfileStatus,
} from "../../../core/services/firestore";
import { USERNAME_TAKEN_MESSAGE } from "../validation";

function messageFor(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-up was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "Something went wrong creating your account. Please try again.";
  }
}

export type SignUpOutcome = "ready" | "needs-username";

export function useSignUp() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Creates the auth account, then claims the username while signed in (rules require
  // auth to read usernames). If the username was taken we keep the account, create the
  // profile without a username, and the user picks another on /app/choose-username —
  // the same gate iOS uses — instead of being left with an orphaned sign-up.
  async function signUpWithEmail(params: {
    name: string;
    email: string;
    username: string;
    password: string;
  }): Promise<SignUpOutcome> {
    setSubmitting(true);
    setError(null);
    try {
      const email = params.email.trim();
      const name = params.name.trim();
      const credential = await createUserWithEmailAndPassword(auth, email, params.password);
      await updateProfile(credential.user, { displayName: name });

      const result = await ensureUserDocuments({
        uid: credential.user.uid,
        name,
        email,
        username: params.username,
      });
      if (result === "username-taken") {
        await createProfileWithoutUsername({ uid: credential.user.uid, name, email });
        setError(USERNAME_TAKEN_MESSAGE);
        return "needs-username";
      }
      return "ready";
    } catch (err) {
      setError(messageFor(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  // Google sign-up, same as iOS: create users/{uid} from the Google profile only if it
  // doesn't exist yet (existing accounts are just signed in, nothing is written), then
  // gate on username if it's empty.
  async function signUpWithGoogle(): Promise<SignUpOutcome> {
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await createProfileWithoutUsername({
        uid: user.uid,
        name: user.displayName ?? user.email?.split("@")[0] ?? "",
        email: user.email ?? user.providerData.find((p) => p.email)?.email ?? "",
      });
      return (await getProfileStatus(user.uid)) === "ready" ? "ready" : "needs-username";
    } catch (err) {
      setError(messageFor(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  return { signUpWithEmail, signUpWithGoogle, submitting, error };
}
