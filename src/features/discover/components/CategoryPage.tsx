import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { Spinner } from "../../../core/components/Spinner";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import type { Movie } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { categoryById, type Category } from "../categories";
import { useCategoryFeed } from "../hooks/useCategoryFeed";
import { useSeenMovies } from "../hooks/useSeenMovies";
import { MovieCard } from "./MovieCard";
import { MovieDetailDialog } from "./MovieDetailDialog";
import "./Discover.css";

export function CategoryPage() {
  const { category } = useParams();
  const found = categoryById(category);
  if (!found) return <Navigate to="/app/discover" replace />;
  return (
    <ProtectedRoute>
      <Feed category={found} />
    </ProtectedRoute>
  );
}

function Feed({ category }: { category: Category }) {
  usePageTitle(category.title);
  const { user, profile } = useAuth();
  const toast = useToast();
  const region = (profile.preferences?.region ?? "US").toUpperCase();
  const seen = useSeenMovies(user!.uid, toast);
  const { movies, loading, done, error, loadMore } = useCategoryFeed(category, seen.excluded, seen.ready);
  const [open, setOpen] = useState<Movie | null>(null);

  // Next page when the end of the list scrolls into view.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, movies.length]);

  return (
    <AppShell>
      <main className="disc">
        <Link to="/app/discover" className="disc__back">‹ Discover</Link>
        <header className="disc__head">
          <h1>{category.title}</h1>
          <p>{category.subtitle}</p>
        </header>

        <div className="disc__grid">
          {movies.map((m) => <MovieCard key={m.id} movie={m} onOpen={setOpen} />)}
        </div>

        {loading && <div className="disc__center"><Spinner /></div>}
        {error && (
          <div className="disc__center">
            <p className="disc__note">Couldn't load more movies.</p>
            <Button variant="ghost" onClick={() => void loadMore()}>Try again</Button>
          </div>
        )}
        {done && movies.length === 0 && <p className="disc__note">You've seen everything in this list.</p>}
        {done && movies.length > 0 && <p className="disc__note disc__end">That's everything.</p>}
        <div ref={sentinel} aria-hidden="true" />
      </main>
      <TmdbAttribution />
      <MovieDetailDialog movie={open} region={region} status={open ? seen.statusOf(open.id) : null} onClose={() => setOpen(null)} onSave={seen.saveForLater} onWatched={seen.markWatched} />
    </AppShell>
  );
}
