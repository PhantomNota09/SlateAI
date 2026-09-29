import { useEffect, useState } from "react";
import { tmdbProxy } from "../../../core/services/cloudFunctions";
import { parseMovieDetail, type MovieDetail } from "../../../core/models/MovieDetail";

const cache = new Map<string, MovieDetail>();
const inflight = new Map<string, Promise<MovieDetail>>();
const MAX_CACHED = 60;

const keyOf = (id: number, region: string) => `${id}:${region}`;

// Movie details (cast, trailer, where to watch) come through the tmdbProxy callable; the
// pool from getRecommendations only has the basic fields.
export function fetchMovieDetail(id: number, region: string): Promise<MovieDetail> {
  const key = keyOf(id, region);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = tmdbProxy<Record<string, unknown>>(`/movie/${id}`, {
    append_to_response: "credits,videos,watch/providers",
  })
    .then((raw) => {
      const detail = parseMovieDetail(raw, region);
      if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value as string);
      cache.set(key, detail);
      return detail;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}

export function useMovieDetail(id: number | null, region: string, prefetchId?: number | null) {
  const [detail, setDetail] = useState<MovieDetail | null>(id ? cache.get(keyOf(id, region)) ?? null : null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (id == null) return;
    let cancelled = false;
    setFailed(false);
    const cached = cache.get(keyOf(id, region));
    setDetail(cached ?? null);
    if (!cached) setLoading(true);
    fetchMovieDetail(id, region)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, region]);

  // Warm the next card so moving through the feed feels instant.
  useEffect(() => {
    if (prefetchId != null) void fetchMovieDetail(prefetchId, region).catch(() => undefined);
  }, [prefetchId, region]);

  return { detail, loading, failed };
}
