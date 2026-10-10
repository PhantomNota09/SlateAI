import { tmdbProxy } from "../../core/services/cloudFunctions";
import { describeCallableError } from "../../core/services/callableErrors";
import type { TmdbMatch } from "./importRunner";

interface SearchResponse {
  results?: { id?: number; title?: string; poster_path?: string | null }[];
}

const MAX_RETRIES = 3;
const DEFAULT_BACKOFF_SECONDS = 20;

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

// Top TMDb hit for a title (and release year when the export has one), via tmdbProxy. If the
// proxy says we're going too fast, wait as long as it asks and try again.
export async function searchMovie(title: string, year: string | null, signal?: AbortSignal): Promise<TmdbMatch | null> {
  const params: Record<string, unknown> = { query: title.slice(0, 200), language: "en-US" };
  if (year && /^\d{4}$/.test(year)) params.year = year;

  for (let attempt = 0; ; attempt++) {
    try {
      const data = await tmdbProxy<SearchResponse>("/search/movie", params);
      const top = data?.results?.[0];
      return top && Number.isInteger(top.id) && typeof top.title === "string"
        ? { id: top.id as number, title: top.title, posterPath: top.poster_path ?? null }
        : null;
    } catch (err) {
      const failure = describeCallableError(err);
      if (failure.kind !== "rate-limited" || attempt >= MAX_RETRIES || signal?.aborted) throw err;
      await pause((failure.retryAfterSeconds ?? DEFAULT_BACKOFF_SECONDS) * 1000, signal);
    }
  }
}
