import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { posterUrl, releaseYear, type MovieRef } from "../../../core/models/Movie";
import type { WatchLaterItem } from "../../../core/models/WatchLaterItem";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { RatingDialog } from "../../recommendations/components/Dialogs";
import { useWatchLater } from "../hooks/useWatchLater";
import "./WatchLater.css";

export function WatchLaterPage() {
  return (
    <ProtectedRoute>
      <WatchLater />
    </ProtectedRoute>
  );
}

function WatchLater() {
  usePageTitle("Watch Later");
  const { user } = useAuth();
  const toast = useToast();
  const { phase, items, reload, remove, markWatched } = useWatchLater(user!.uid, toast);
  const [rating, setRating] = useState<MovieRef | null>(null);

  if (phase === "loading") {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }
  if (phase === "error") {
    return (
      <AppShell>
        <ErrorState title="Couldn't load Watch Later" message="Check your connection and try again." onRetry={() => void reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="wl">
        <header className="wl__head">
          <h1>Watch Later</h1>
          <p>{items.length === 0 ? "Movies you save show up here." : `${items.length} saved ${items.length === 1 ? "movie" : "movies"}`}</p>
        </header>

        {items.length === 0 ? (
          <div className="wl__empty">
            <p>Nothing saved yet.</p>
            <small>Choose “Save to Watch Later” on any recommendation and it will be waiting here.</small>
            <Link to="/app/recommendations">
              <Button>Find something to watch</Button>
            </Link>
          </div>
        ) : (
          <ul className="wl__grid">
            {items.map((item) => (
              <WatchLaterCard
                key={item.movieId}
                item={item}
                onWatched={() => setRating({ id: item.movieId, title: item.title, posterPath: item.posterPath })}
                onRemove={() => void remove(item.movieId)}
              />
            ))}
          </ul>
        )}
      </main>
      <TmdbAttribution />
      <RatingDialog movie={rating} onClose={() => setRating(null)} onRate={(m, r) => void markWatched(m, r)} />
    </AppShell>
  );
}

function WatchLaterCard({ item, onWatched, onRemove }: { item: WatchLaterItem; onWatched: () => void; onRemove: () => void }) {
  const poster = posterUrl(item.posterPath, "w342");
  const meta = [releaseYear(item.releaseDate), item.voteAverage ? `★ ${item.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ");
  return (
    <li className="wl__card">
      {poster ? <img src={poster} alt={`${item.title} poster`} loading="lazy" /> : <span className="wl__blank" aria-hidden="true" />}
      <div className="wl__text">
        <strong>{item.title}</strong>
        {meta && <small>{meta}</small>}
      </div>
      <div className="wl__actions">
        <button type="button" onClick={onWatched}>
          Watched
        </button>
        <button type="button" className="wl__remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    </li>
  );
}
