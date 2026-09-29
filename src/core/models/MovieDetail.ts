// Parsed `/movie/{id}?append_to_response=credits,videos,watch/providers` from TMDb (via the
// tmdbProxy callable). Only what the recommendation card shows.
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
  priority: number;
}

export interface CountryProviders {
  link: string | null; // JustWatch page — attribution link required by TMDb
  stream: WatchProvider[];
  rentOrBuy: WatchProvider[];
}

export interface MovieDetail {
  id: number;
  title: string;
  overview: string;
  backdropPath: string | null;
  releaseDate: string | null;
  runtime: number | null;
  voteAverage: number;
  genres: { id: number; name: string }[];
  originalLanguage: string | null;
  countries: string[];
  cast: CastMember[];
  trailerKey: string | null;
  providers: CountryProviders | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

function parseProviders(list: Raw[] | undefined): WatchProvider[] {
  return (list ?? [])
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      priority: p.display_priority ?? 999,
    }))
    .sort((a, b) => a.priority - b.priority);
}

export function parseMovieDetail(raw: Raw, region: string): MovieDetail {
  const regional = raw["watch/providers"]?.results?.[region.toUpperCase()];
  const stream = parseProviders(regional?.flatrate);
  const seen = new Set<number>();
  const rentOrBuy = [...parseProviders(regional?.rent), ...parseProviders(regional?.buy)].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const trailer = (raw.videos?.results ?? []).find((v: Raw) => v.type === "Trailer" && v.site === "YouTube");

  return {
    id: raw.id,
    title: raw.title ?? "",
    overview: raw.overview ?? "",
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date || null,
    runtime: raw.runtime || null,
    voteAverage: raw.vote_average ?? 0,
    genres: raw.genres ?? [],
    originalLanguage: raw.original_language ?? null,
    countries: (raw.production_countries ?? []).map((c: Raw) => c.name).filter(Boolean),
    cast: (raw.credits?.cast ?? []).map((c: Raw) => ({
      id: c.id,
      name: c.name,
      character: c.character ?? "",
      profilePath: c.profile_path ?? null,
    })),
    trailerKey: trailer?.key ?? null,
    providers: regional
      ? { link: regional.link ?? null, stream, rentOrBuy }
      : null,
  };
}
