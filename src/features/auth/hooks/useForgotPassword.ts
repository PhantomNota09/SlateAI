import { useState } from "react";
import { sendPasswordResetEmail, type AuthError } from "firebase/auth";
import { auth } from "../../../core/services/firebase";

export function useForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendReset(email: string) {
    setSubmitting(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      const code = (err as AuthError)?.code;
      // user-not-found is deliberately reported as success: don't reveal which emails have accounts.
      if (code === "auth/user-not-found") setSent(true);
      else if (code === "auth/invalid-email") setError("Enter a valid email address.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Try again later.");
      else setError("Couldn't send the reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return { sendReset, sent, submitting, error };
}
