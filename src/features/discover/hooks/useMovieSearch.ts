import { useEffect, useRef, useState } from "react";
import { normalizeTmdbResults, type Movie } from "../../../core/models/Movie";
import { tmdbProxy } from "../../../core/services/cloudFunctions";

// Title search (iOS TMDbService.searchMovies), debounced; a stale response never replaces a newer one.
export function useMovieSearch(query: string) {
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      latest.current++;
      setResults([]);
      setSearching(false);
      setFailed(false);
      return;
    }
    const run = ++latest.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = normalizeTmdbResults(await tmdbProxy<unknown>("/search/movie", { query: q.slice(0, 200), page: 1, language: "en-US" }));
        if (run !== latest.current) return;
        setResults(found.slice(0, 24));
        setFailed(false);
      } catch (err) {
        if (run !== latest.current) return;
        console.error("Movie search failed", err);
        setResults([]);
        setFailed(true);
      } finally {
        if (run === latest.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  return { results, searching, failed, active: q.length >= 2 };
}
