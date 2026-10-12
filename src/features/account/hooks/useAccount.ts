import { useCallback, useState } from "react";
import { changePassword, updateDisplayName, MAX_NAME_LENGTH } from "../../../core/services/account";
import { checkPassword } from "../../auth/validation";

export function nameProblem(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return "Enter your name.";
  if (name.length > MAX_NAME_LENGTH) return `Keep it to ${MAX_NAME_LENGTH} characters or fewer.`;
  return null;
}

export function passwordErrorMessage(code: string | undefined): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Your current password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/requires-recent-login":
      return "For your security, sign out and back in, then try again.";
    default:
      return "Couldn't change your password. Please try again.";
  }
}

type Toast = (kind: "success" | "error", message: string) => void;

export function useAccount(uid: string, onToast: Toast, onProfileChanged: () => Promise<void>) {
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const saveName = useCallback(
    async (raw: string): Promise<boolean> => {
      if (nameProblem(raw)) return false;
      setSavingName(true);
      try {
        await updateDisplayName(uid, raw.trim());
        await onProfileChanged();
        onToast("success", "Name updated.");
        return true;
      } catch (err) {
        console.error("Updating name failed", err);
        onToast("error", "Couldn't update your name. Please try again.");
        return false;
      } finally {
        setSavingName(false);
      }
    },
    [uid, onToast, onProfileChanged],
  );

  const savePassword = useCallback(
    async (current: string, next: string): Promise<boolean> => {
      setPasswordError(null);
      if (!current) {
        setPasswordError("Enter your current password.");
        return false;
      }
      if (!checkPassword(next).isValid) {
        setPasswordError("Your new password doesn't meet all the requirements.");
        return false;
      }
      if (next === current) {
        setPasswordError("Your new password must be different from the current one.");
        return false;
      }
      setSavingPassword(true);
      try {
        await changePassword(current, next);
        onToast("success", "Password changed.");
        return true;
      } catch (err) {
        console.error("Changing password failed", err);
        setPasswordError(passwordErrorMessage((err as { code?: string })?.code));
        return false;
      } finally {
        setSavingPassword(false);
      }
    },
    [onToast],
  );

  return { savingName, savingPassword, passwordError, saveName, savePassword };
}
