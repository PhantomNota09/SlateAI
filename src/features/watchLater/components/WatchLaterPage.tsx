import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { posterUrl, releaseYear, type Movie, type MovieRef } from "../../../core/models/Movie";
import type { WatchLaterItem } from "../../../core/models/WatchLaterItem";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { MovieDetailDialog } from "../../discover/components/MovieDetailDialog";
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
  const { user, profile } = useAuth();
  const toast = useToast();
  const { phase, items, reload, remove, markWatched } = useWatchLater(user!.uid, toast);
  const [rating, setRating] = useState<MovieRef | null>(null);
  const [open, setOpen] = useState<Movie | null>(null);
  const region = (profile.preferences?.region ?? "US").toUpperCase();

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
                onOpen={() => setOpen(toMovie(item))}
                onWatched={() => setRating({ id: item.movieId, title: item.title, posterPath: item.posterPath })}
                onRemove={() => void remove(item.movieId)}
              />
            ))}
          </ul>
        )}
      </main>
      <MovieDetailDialog
        movie={open}
        region={region}
        status="saved"
        onClose={() => setOpen(null)}
        onSave={async () => true}
        onWatched={async (m, r) => {
          await markWatched(m, r);
          return true;
        }}
      />
      <RatingDialog movie={rating} onClose={() => setRating(null)} onRate={(m, r) => void markWatched(m, r)} />
    </AppShell>
  );
}

// The detail view fetches the rest (overview, cast, trailer, where to watch) itself; the saved item
// supplies what the card needs straight away.
function toMovie(item: WatchLaterItem): Movie {
  return {
    id: item.movieId,
    title: item.title,
    overview: "",
    posterPath: item.posterPath,
    backdropPath: null,
    releaseDate: item.releaseDate,
    voteAverage: item.voteAverage,
    genreIds: [],
    originalLanguage: "",
    runtime: null,
    matchPercentage: null,
    reasons: [],
  };
}

function WatchLaterCard({ item, onOpen, onWatched, onRemove }: { item: WatchLaterItem; onOpen: () => void; onWatched: () => void; onRemove: () => void }) {
  const poster = posterUrl(item.posterPath, "w342");
  const meta = [releaseYear(item.releaseDate), item.voteAverage ? `★ ${item.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ");
  return (
    <li className="wl__card">
      <button type="button" className="wl__open" onClick={onOpen} aria-label={`Details for ${item.title}`}>
        {poster ? <img src={poster} alt={`${item.title} poster`} loading="lazy" /> : <span className="wl__blank" aria-hidden="true" />}
        <span className="wl__text">
          <strong>{item.title}</strong>
          {meta && <small>{meta}</small>}
        </span>
      </button>
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
