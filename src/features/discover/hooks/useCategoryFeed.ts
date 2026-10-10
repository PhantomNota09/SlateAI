import { useCallback, useEffect, useRef, useState } from "react";
import type { Movie } from "../../../core/models/Movie";
import type { Category } from "../categories";
import { freshFromPage, TMDB_PAGE_SIZE } from "../discoverLogic";
import { fetchListPage } from "./useDiscover";

const MAX_EMPTY_PAGES = 5; // pages in a row that were entirely filtered out before we give up for now

// One category's full list, paged as you scroll (iOS DiscoverSeeAllViewModel).
export function useCategoryFeed(category: Category, excluded: ReadonlySet<number>, ready: boolean) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const seen = useRef(new Set<number>());
  const page = useRef(0);
  const busy = useRef(false);
  const excludedRef = useRef(excluded);
  excludedRef.current = excluded;

  const loadMore = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      for (let attempt = 0; attempt < MAX_EMPTY_PAGES; attempt++) {
        const next = page.current + 1;
        const batch = await fetchListPage(category.path, next);
        page.current = next;
        const last = batch.length < TMDB_PAGE_SIZE;
        const fresh = freshFromPage(batch, excludedRef.current, seen.current);
        if (fresh.length > 0) setMovies((m) => [...m, ...fresh]);
        if (last) {
          setDone(true);
          break;
        }
        if (fresh.length > 0) break;
      }
    } catch (err) {
      console.error("Failed to load more films", err);
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [category.path, done]);

  // First page once the exclusion lists are known.
  useEffect(() => {
    if (ready && page.current === 0) void loadMore();
  }, [ready, loadMore]);

  return { movies, loading, done, error, loadMore };
}
