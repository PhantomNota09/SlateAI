import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../core/services/firebase";
import { readProfile, type ProfileSnapshot } from "../../../core/services/firestore";

interface AuthContextValue {
  user: User | null;
  // "missing": no users/{uid} doc; "needs-username": doc exists but username is empty.
  profile: ProfileSnapshot;
  // True when the profile read itself failed (offline, transient error). Callers must show a
  // retry state — never treat a failed read as "no profile", or a signed-in user with a
  // perfectly good account would be routed into sign-up steps.
  profileError: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const EMPTY_PROFILE: ProfileSnapshot = { status: "missing", isOnboarded: false, preferences: null };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSnapshot>(EMPTY_PROFILE);
  const [profileError, setProfileError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Only the most recent load may update state. Right after sign-up the auth-state read (which
  // ran before the profile existed and says "missing") can finish AFTER the post-sign-up
  // refresh; without this it would overwrite the fresh result and bounce the user back into
  // the username step.
  const latestLoad = useRef(0);

  const load = useCallback(async (uid: string | null) => {
    const seq = ++latestLoad.current;
    if (!uid) {
      setProfile(EMPTY_PROFILE);
      setProfileError(false);
      return;
    }
    try {
      const next = await readProfile(uid);
      if (seq !== latestLoad.current) return;
      setProfile(next);
      setProfileError(false);
    } catch {
      if (seq !== latestLoad.current) return;
      setProfileError(true);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      await load(nextUser?.uid ?? null);
      setLoading(false);
    });
  }, [load]);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await load(auth.currentUser?.uid ?? null);
    setLoading(false);
  }, [load]);

  return (
    <AuthContext.Provider value={{ user, profile, profileError, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
