import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { Spinner } from "../../../core/components/Spinner";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import type { Movie } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { CATEGORIES } from "../categories";
import { useDiscoverLists, useDiscoverRows } from "../hooks/useDiscover";
import { useMovieSearch } from "../hooks/useMovieSearch";
import { useSeenMovies } from "../hooks/useSeenMovies";
import { HeroBanner } from "./HeroBanner";
import { MovieCard } from "./MovieCard";
import { MovieDetailDialog } from "./MovieDetailDialog";
import "./Discover.css";

export function DiscoverPage() {
  return (
    <ProtectedRoute>
      <Discover />
    </ProtectedRoute>
  );
}

function Discover() {
  usePageTitle("Discover");
  const { user, profile } = useAuth();
  const toast = useToast();
  const region = (profile.preferences?.region ?? "US").toUpperCase();
  const seen = useSeenMovies(user!.uid, toast);
  const { phase, lists, reload } = useDiscoverLists();
  const { rows, featured } = useDiscoverRows(lists, seen.excluded);
  // The query comes from the search box in the top bar (/app/discover?q=…).
  const query = useSearchParams()[0].get("q") ?? "";
  const search = useMovieSearch(query);
  const [open, setOpen] = useState<Movie | null>(null);

  if (phase === "loading" || !seen.ready) return <AppShell><LoadingState /></AppShell>;
  if (phase === "error") {
    return (
      <AppShell>
        <ErrorState title="Couldn't load Discover" message="Check your connection and try again." onRetry={() => void reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="disc">
        {search.active ? (
          <header className="disc__head">
            <h1>Results for “{query.trim()}”</h1>
          </header>
        ) : (
          <h1 className="sr-only">Discover</h1>
        )}

        {search.active ? (
          <section aria-label="Search results">
            {search.searching && <div className="disc__center"><Spinner /></div>}
            {search.failed && <p className="disc__note">Search failed. Please try again.</p>}
            {!search.searching && !search.failed && search.results.length === 0 && <p className="disc__note">No movies found for “{query.trim()}”.</p>}
            <div className="disc__grid">
              {search.results.map((m) => <MovieCard key={m.id} movie={m} onOpen={setOpen} />)}
            </div>
          </section>
        ) : (
          <>
            {featured && <HeroBanner movie={featured} region={region} onOpen={setOpen} />}
            {CATEGORIES.map((c) =>
              rows[c.id].length === 0 ? null : (
                <section key={c.id} className="disc__row" aria-labelledby={`disc-${c.id}`}>
                  <header>
                    <div>
                      <h2 id={`disc-${c.id}`}>{c.title}</h2>
                      <p>{c.subtitle}</p>
                    </div>
                    <Link to={`/app/discover/${c.id}`}>See all ›</Link>
                  </header>
                  <div className="disc__scroller">
                    {rows[c.id].map((m, i) => <MovieCard key={m.id} movie={m} rank={c.id === "trending" ? i + 1 : undefined} onOpen={setOpen} />)}
                    <Link to={`/app/discover/${c.id}`} className="dcard dcard--more">See all</Link>
                  </div>
                </section>
              ),
            )}
            {CATEGORIES.every((c) => rows[c.id].length === 0) && <p className="disc__note">You've seen everything here. Check back soon.</p>}
          </>
        )}
      </main>
      <MovieDetailDialog movie={open} region={region} status={open ? seen.statusOf(open.id) : null} onClose={() => setOpen(null)} onSave={seen.saveForLater} onWatched={seen.markWatched} />
    </AppShell>
  );
}
