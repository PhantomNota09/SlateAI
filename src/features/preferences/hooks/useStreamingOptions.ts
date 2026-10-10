import { useEffect, useState } from "react";
import { tmdbProxy } from "../../../core/services/cloudFunctions";

export interface Region {
  code: string;
  name: string;
}
export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

interface RawRegion {
  iso_3166_1: string;
  english_name: string;
}
interface RawProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priorities?: Record<string, number>;
  display_priority?: number;
}

// Region and provider lists change rarely; keep them for the life of the tab.
let regionsCache: Region[] | null = null;
const providersCache = new Map<string, Provider[]>();

export function parseRegions(raw: unknown): Region[] {
  const results = (raw as { results?: RawRegion[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  return results
    .filter((r) => /^[A-Z]{2}$/.test(r?.iso_3166_1) && typeof r.english_name === "string")
    .map((r) => ({ code: r.iso_3166_1, name: r.english_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function parseProviders(raw: unknown, region: string): Provider[] {
  const results = (raw as { results?: RawProvider[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  const rank = (p: RawProvider) => p.display_priorities?.[region] ?? p.display_priority ?? 999;
  return results
    .filter((p) => Number.isInteger(p?.provider_id) && typeof p.provider_name === "string")
    .sort((a, b) => rank(a) - rank(b) || a.provider_name.localeCompare(b.provider_name))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null }));
}

// Region list and the streaming services offered in a region, via tmdbProxy.
export function useStreamingOptions(region: string) {
  const [regions, setRegions] = useState<Region[]>(regionsCache ?? []);
  const [providers, setProviders] = useState<Provider[]>(providersCache.get(region) ?? []);
  const [loading, setLoading] = useState(!providersCache.has(region));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (regionsCache) return;
    let cancelled = false;
    tmdbProxy<unknown>("/watch/providers/regions")
      .then((raw) => {
        regionsCache = parseRegions(raw);
        if (!cancelled) setRegions(regionsCache);
      })
      .catch(() => {
        /* the page still works with the current region only */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cached = providersCache.get(region);
    if (cached) {
      setProviders(cached);
      setLoading(false);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    tmdbProxy<unknown>("/watch/providers/movie", { watch_region: region })
      .then((raw) => {
        const list = parseProviders(raw, region);
        providersCache.set(region, list);
        if (!cancelled) setProviders(list);
      })
      .catch((err) => {
        console.error("Failed to load streaming services", err);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [region]);

  return { regions, providers, loading, failed };
}
