import { useEffect, useState } from "react";
import { tmdbProxy } from "../../../core/services/cloudFunctions";
import { FALLBACK_LANGUAGES, type Language } from "../data";

interface TmdbLanguage {
  iso_639_1: string;
  english_name: string;
  name: string;
}

let cached: Language[] | null = null;

// Full TMDb language list via tmdbProxy (same source as iOS). Starts with the built-in
// list so the picker works immediately and if the request fails (iOS does the same).
export function useLanguages() {
  const [languages, setLanguages] = useState<readonly Language[]>(cached ?? FALLBACK_LANGUAGES);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    tmdbProxy<TmdbLanguage[]>("/configuration/languages")
      .then((list) => {
        if (!Array.isArray(list) || list.length === 0) return;
        cached = list
          .map((l) => ({ code: l.iso_639_1, name: l.english_name, nativeName: l.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setLanguages(cached);
      })
      .catch(() => {
        /* keep the fallback list */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { languages, loading };
}
