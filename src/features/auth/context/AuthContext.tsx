import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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

  const load = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(EMPTY_PROFILE);
      setProfileError(false);
      return;
    }
    try {
      setProfile(await readProfile(uid));
      setProfileError(false);
    } catch {
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
