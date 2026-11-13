import { useCallback, useState } from "react";
import type { User } from "firebase/auth";
import { deleteAccount } from "../../../core/services/account";

export function deleteErrorMessage(code: string | undefined): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password is incorrect.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was closed before it finished. Nothing was deleted.";
    case "auth/user-mismatch":
      return "That Google account isn't the one you're signed in with. Nothing was deleted.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Couldn't delete your account. Nothing was lost on your side, so please try again.";
  }
}

type Toast = (kind: "success" | "error", message: string) => void;

// `password` set = re-authenticate with it; undefined = re-authenticate with Google.
export function useDeleteAccount(user: User, onToast: Toast) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (password?: string): Promise<boolean> => {
      if (password !== undefined && !password) {
        setError("Enter your password to confirm.");
        return false;
      }
      setError(null);
      setDeleting(true);
      try {
        await deleteAccount(user, password);
        onToast("success", "Your account has been deleted.");
        return true; // signing out is handled by the auth listener; this screen goes away
      } catch (err) {
        console.error("Deleting account failed", err);
        setError(deleteErrorMessage((err as { code?: string })?.code));
        setDeleting(false);
        return false;
      }
    },
    [user, onToast],
  );

  return { deleting, error, remove };
}
