// Shape of the `getCollections` callable (backend docs/COLLECTIONS.md). Parsed defensively:
// a malformed franchise or part is dropped instead of breaking the whole tab.
export interface FranchisePart {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

export interface Franchise {
  id: string;
  displayName: string;
  overview: string;
  categories: string[];
  posterPath: string | null;
  backdropPath: string | null;
  parts: FranchisePart[]; // oldest first
}

export interface FranchisePayload {
  version: string;
  franchises: Franchise[];
}

// The filter chips on the Collections tab (iOS FranchiseCategory); "All" shows everything.
export const FRANCHISE_CATEGORIES = ["Superhero", "Action", "Horror", "Comedy", "Sci-Fi", "Fantasy", "Animation", "Crime", "Adventure"] as const;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const pathOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

function parsePart(raw: unknown): FranchisePart | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r.id !== "number" || !Number.isFinite(r.id)) return null;
  return {
    id: r.id,
    title: str(r.title),
    overview: str(r.overview),
    posterPath: pathOrNull(r.posterPath),
    backdropPath: pathOrNull(r.backdropPath),
    releaseDate: pathOrNull(r.releaseDate),
    voteAverage: typeof r.voteAverage === "number" ? r.voteAverage : 0,
  };
}

function parseFranchise(raw: unknown): Franchise | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r.id !== "string" || !r.id) return null;
  const parts = Array.isArray(r.parts) ? r.parts.flatMap((p) => parsePart(p) ?? []) : [];
  if (parts.length === 0) return null; // the server never sends an empty franchise
  return {
    id: r.id,
    displayName: str(r.displayName) || r.id,
    overview: str(r.overview),
    categories: Array.isArray(r.categories) ? r.categories.filter((c): c is string => typeof c === "string") : [],
    posterPath: pathOrNull(r.posterPath),
    backdropPath: pathOrNull(r.backdropPath),
    parts,
  };
}

export function parseFranchisePayload(raw: unknown): FranchisePayload | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r.version !== "string" || !Array.isArray(r.franchises)) return null;
  return { version: r.version, franchises: r.franchises.flatMap((f) => parseFranchise(f) ?? []) };
}

export function franchiseProgress(franchise: Franchise, watched: ReadonlySet<number>) {
  const total = franchise.parts.length;
  const done = franchise.parts.filter((p) => watched.has(p.id)).length;
  return { watched: done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}
