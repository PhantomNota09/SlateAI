import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GENRES } from "../../../core/models/genres";
import type { UserStats } from "../../../core/models/UserStats";
import { generateAnalyticsInsights, tmdbProxy, type AnalyticsInsights } from "../../../core/services/cloudFunctions";
import { loadLetterboxdMovies } from "../../../core/services/letterboxd";
import { loadUserCollections } from "../../../core/services/userCollections";
import { loadUserStats } from "../../../core/services/userStats";
import { combineHistory, MIN_FILMS, parseFilmDetail, summarize, tasteBreakdown, type FilmDetail, type RatedFilm } from "../insightsLogic";

export const SAMPLE_SIZE = 40; // most recent films looked up on TMDb for the taste breakdown
const CONCURRENCY = 3;

export type AiState = { phase: "idle" } | { phase: "loading" } | { phase: "ready"; data: AnalyticsInsights } | { phase: "error"; message: string };

export function aiErrorMessage(err: unknown): string {
  const code = String((err as { code?: unknown })?.code ?? "").replace(/^functions\//, "");
  if (code === "resource-exhausted") return "You've reached today's limit for insights. Try again tomorrow.";
  if (code === "unavailable") return "Insights are temporarily unavailable. Please try again in a moment.";
  return "We couldn't generate insights right now. Please try again.";
}

// Data for /app/insights: your history from Slate + Letterboxd, a taste breakdown from TMDb details of
// your most recent films, and a taste summary from the generateAnalyticsInsights callable on request.
export function useInsights(uid: string) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [films, setFilms] = useState<RatedFilm[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [details, setDetails] = useState<FilmDetail[]>([]);
  const [detailsDone, setDetailsDone] = useState(false);
  const [ai, setAi] = useState<AiState>({ phase: "idle" });
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    setPhase("loading");
    setDetails([]);
    setDetailsDone(false);
    setAi({ phase: "idle" });
    try {
      const [collections, imported, userStats] = await Promise.all([
        loadUserCollections(uid),
        loadLetterboxdMovies(uid).catch(() => []),
        loadUserStats(uid).catch(() => null),
      ]);
      if (gen !== generation.current) return;
      const slate: RatedFilm[] = collections.watched.map((w) => ({ movieId: w.movieId, rating: w.rating, at: w.watchedAt }));
      const lb: RatedFilm[] = imported.map((m) => ({ movieId: m.movieId, rating: m.letterboxdRating, at: m.watchedDate ?? m.importedAt }));
      setFilms(combineHistory(slate, lb));
      setStats(userStats);
      setPhase("ready");
    } catch (err) {
      if (gen !== generation.current) return;
      console.error("Failed to load insights", err);
      setPhase("error");
    }
  }, [uid]);

  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);

  const summary = useMemo(() => summarize(films), [films]);
  const enough = films.length >= MIN_FILMS;

  // Taste breakdown: look up the most recent films, a few at a time, showing results as they arrive.
  useEffect(() => {
    if (phase !== "ready" || !enough) return;
    const sample = [...films].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, SAMPLE_SIZE);
    let cancelled = false;
    let next = 0;
    const found: FilmDetail[] = [];

    async function worker() {
      while (!cancelled && next < sample.length) {
        const film = sample[next++];
        try {
          const detail = parseFilmDetail(await tmdbProxy<unknown>(`/movie/${film.movieId}`));
          if (detail && !cancelled) {
            found.push(detail);
            setDetails([...found]);
          }
        } catch (err) {
          console.warn("Insights: details unavailable for", film.movieId, err);
        }
      }
    }
    void Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => !cancelled && setDetailsDone(true));
    return () => {
      cancelled = true;
    };
  }, [phase, enough, films]);

  const taste = useMemo(() => {
    const ratings = new Map(films.map((f) => [f.movieId, f.rating] as const));
    return tasteBreakdown(details, ratings);
  }, [details, films]);

  const generate = useCallback(
    async (forceRefresh: boolean) => {
      setAi({ phase: "loading" });
      // Real viewing data when we have it; otherwise the genres chosen in onboarding.
      const names = taste.topGenres.length > 0 ? taste.topGenres.map((g) => g.name) : (stats?.topGenres ?? []);
      const variety = taste.sampled > 0 ? taste.variety : Math.round((Math.min(names.length, GENRES.length) / GENRES.length) * 100);
      try {
        const data = await generateAnalyticsInsights({
          totalMovies: summary.total,
          averageRating: Number(summary.average.toFixed(2)),
          topGenres: names.slice(0, 3),
          explorationScore: variety,
          forceRefresh,
        });
        setAi({ phase: "ready", data });
      } catch (err) {
        console.error("Insights generation failed", err);
        setAi({ phase: "error", message: aiErrorMessage(err) });
      }
    },
    [taste, stats, summary],
  );

  return { phase, films, stats, summary, enough, taste, tasteLoading: enough && !detailsDone, ai, generate, reload: load };
}
