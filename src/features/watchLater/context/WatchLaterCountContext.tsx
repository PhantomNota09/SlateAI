import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeWatchLaterCount } from "../../../core/services/userCollections";
import { useAuth } from "../../auth/context/AuthContext";

const Ctx = createContext<number | undefined>(undefined);

// One live listener for the whole signed-in app, so the Watch Later badge in the nav is the same on
// every page (and updates when you save or remove a film, or change it from another device).
export function WatchLaterCountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [count, setCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    setCount(undefined);
    if (!uid) return;
    return subscribeWatchLaterCount(
      uid,
      setCount,
      (err) => {
        console.error("Watch Later count listener failed", err);
        setCount(undefined); // no badge is better than a wrong one
      },
    );
  }, [uid]);

  return <Ctx.Provider value={count}>{children}</Ctx.Provider>;
}

// undefined until the first snapshot arrives (and outside the provider, as in tests).
export function useWatchLaterCount(): number | undefined {
  return useContext(Ctx);
}
