import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeTmdbResults, type Movie } from "../../../core/models/Movie";
import { tmdbProxy } from "../../../core/services/cloudFunctions";
import { CATEGORIES } from "../categories";
import { buildRows, PAGES_PER_ROW, type Lists } from "../discoverLogic";

export async function fetchListPage(path: string, page: number): Promise<Movie[]> {
  return normalizeTmdbResults(await tmdbProxy<unknown>(path, { page, language: "en-US" }));
}

// TMDb's four lists, ~60 films each (iOS DiscoverViewModel.loadAllContent). A list that fails to load
// leaves its row empty; only when every list fails is the page an error.
export function useDiscoverLists() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [lists, setLists] = useState<Lists>({ trending: [], topRated: [], nowPlaying: [], upcoming: [] });
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    setPhase("loading");
    try {
      const fetched = await Promise.all(
        CATEGORIES.map(async (c) => {
          const pages = await Promise.allSettled(Array.from({ length: PAGES_PER_ROW }, (_, i) => fetchListPage(c.path, i + 1)));
          const ok = pages.flatMap((p) => (p.status === "fulfilled" ? [p.value] : []));
          return { id: c.id, movies: ok.flat(), failed: ok.length === 0 };
        }),
      );
      if (gen !== generation.current) return;
      if (fetched.every((f) => f.failed)) throw new Error("Every Discover list failed to load");
      const next: Lists = { trending: [], topRated: [], nowPlaying: [], upcoming: [] };
      for (const f of fetched) next[f.id] = f.movies;
      setLists(next);
      setPhase("ready");
    } catch (err) {
      if (gen !== generation.current) return;
      console.error("Failed to load Discover", err);
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  return { phase, lists, reload: load };
}

export function useDiscoverRows(lists: Lists, excluded: ReadonlySet<number>) {
  return useMemo(() => buildRows(lists, excluded), [lists, excluded]);
}
