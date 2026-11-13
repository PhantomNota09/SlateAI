// Pure rules for Discover, ported from DiscoverViewModel.applyWatchedFilter and
// DiscoverSeeAllViewModel so both platforms behave the same.
import type { Movie } from "../../core/models/Movie";
import type { CategoryId } from "./categories";
import { CATEGORIES } from "./categories";

export const ROW_SIZE = 15; // films shown per home row
export const PAGES_PER_ROW = 3; // ~60 candidates per row, so filtering still leaves a full row

export type Lists = Record<CategoryId, Movie[]>;
export type Rows = Record<CategoryId, Movie[]>;

// Home rows: drop what you've already watched/saved/imported, keep 15 per row, and don't repeat a
// film across rows (earlier rows win). "See all" pages still show each list's true contents.
export function buildRows(lists: Lists, excluded: ReadonlySet<number>): { rows: Rows; featured: Movie | null } {
  const shown = new Set<number>();
  const rows = {} as Rows;
  for (const c of CATEGORIES) {
    // TMDb's pages can overlap, so a film may appear twice in one list; keep its first place only.
    const inRow = new Set<number>();
    const row = (lists[c.id] ?? [])
      .filter((m) => {
        if (excluded.has(m.id) || shown.has(m.id) || inRow.has(m.id)) return false;
        inRow.add(m.id);
        return true;
      })
      .slice(0, ROW_SIZE);
    row.forEach((m) => shown.add(m.id));
    rows[c.id] = row;
  }
  // The hero is the first unseen trending film that has artwork to show.
  const featured = rows.trending.find((m) => m.backdropPath) ?? rows.trending[0] ?? null;
  return { rows, featured };
}

// "See all": a page can come back entirely filtered out, so the caller keeps asking for more pages
// (a few at most) rather than leaving the list looking stuck.
export function freshFromPage(batch: readonly Movie[], excluded: ReadonlySet<number>, seen: Set<number>): Movie[] {
  const fresh = batch.filter((m) => !excluded.has(m.id) && !seen.has(m.id));
  fresh.forEach((m) => seen.add(m.id));
  return fresh;
}

export const TMDB_PAGE_SIZE = 20; // a shorter page means TMDb has no more
