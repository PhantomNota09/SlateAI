import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { useLetterboxdImport } from "../context/LetterboxdImportContext";
import "./Letterboxd.css";

const key = (uid: string) => `slate.letterboxd-prompt-dismissed.${uid}`;

function dismissed(uid: string): boolean {
  try {
    return localStorage.getItem(key(uid)) === "1";
  } catch {
    return false;
  }
}

// A one-line offer on For You for people who haven't imported (and skipped the post-onboarding offer).
// Gone for good once dismissed, once an import has been done, or while one is running.
export function LetterboxdPrompt() {
  const { user, profile } = useAuth();
  const { state } = useLetterboxdImport();
  const uid = user?.uid ?? "";
  const [hidden, setHidden] = useState(() => dismissed(uid));

  const source = String(profile.preferences?.letterboxdImportSource ?? "none");
  if (hidden || !uid || (source !== "none" && source !== "") || state.step !== "idle") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key(uid), "1");
    } catch {
      /* it will just show again next time */
    }
    setHidden(true);
  };

  return (
    <aside className="lbx-prompt" aria-label="Import from Letterboxd">
      <p>
        <strong>On Letterboxd?</strong> Import your history so Slate skips films you've already seen.
      </p>
      <div>
        <Link to="/app/letterboxd" className="lbx-prompt__go">Import</Link>
        <button type="button" onClick={dismiss} aria-label="Dismiss">✕</button>
      </div>
    </aside>
  );
}
