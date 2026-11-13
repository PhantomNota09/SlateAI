import { useCallback, useEffect, useRef, useState } from "react";
import type { FranchisePayload } from "../../../core/models/Franchise";
import { fetchFranchises, readCachedFranchises } from "../../../core/services/collections";

// The franchise list: the last payload from localStorage shows immediately, then the server is asked
// whether it is still current. With nothing cached and a failed call the page shows a retry.
export function useFranchises() {
  const [payload, setPayload] = useState<FranchisePayload | null>(() => readCachedFranchises());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const version = useRef(payload?.version);
  const live = useRef(true);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setFailed(false);
    try {
      const next = await fetchFranchises(version.current, refresh);
      if (next && live.current) {
        version.current = next.version;
        setPayload(next);
      }
    } catch (err) {
      console.error("getCollections failed", err);
      // With something on screen a failed check is invisible; with nothing the page offers a retry.
      if (live.current && !version.current) setFailed(true);
    } finally {
      if (live.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    live.current = true;
    void load();
    return () => {
      live.current = false;
    };
  }, [load]);

  return { franchises: payload?.franchises ?? null, loading, failed, retry: () => load(), refresh: () => load(true) };
}
