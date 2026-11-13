import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { ProgressBar } from "../../../core/components/ProgressBar";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { franchiseProgress, type Franchise, type FranchisePart } from "../../../core/models/Franchise";
import { posterUrl, releaseYear, type Movie, type MovieRef } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { MovieDetailDialog } from "../../discover/components/MovieDetailDialog";
import { useSeenMovies } from "../../discover/hooks/useSeenMovies";
import { RatingDialog } from "../../recommendations/components/Dialogs";
import { useCollectionProgress } from "../hooks/useCollectionProgress";
import { useFranchises } from "../hooks/useFranchises";
import "./Collections.css";

export function CollectionDetailPage() {
  return (
    <ProtectedRoute>
      <Detail />
    </ProtectedRoute>
  );
}

// A franchise part as the film dialog expects it; fields the franchise list doesn't carry are left empty.
const toMovie = (p: FranchisePart): Movie => ({
  id: p.id,
  title: p.title,
  overview: p.overview,
  posterPath: p.posterPath,
  backdropPath: p.backdropPath,
  releaseDate: p.releaseDate,
  voteAverage: p.voteAverage,
  genreIds: [],
  originalLanguage: "",
  runtime: null,
  matchPercentage: null,
  reasons: [],
});

function Detail() {
  const { id } = useParams();
  const { franchises, failed, retry } = useFranchises();
  const franchise = franchises?.find((f) => f.id === id);

  if (!franchises) {
    return <AppShell>{failed ? <ErrorState title="Couldn't load Collections" message="Check your connection and try again." onRetry={retry} /> : <LoadingState />}</AppShell>;
  }
  if (!franchise) {
    return (
      <AppShell>
        <ErrorState title="Collection not found" message="It may have been renamed or removed." onRetry={retry} />
      </AppShell>
    );
  }
  return <FranchiseView franchise={franchise} />;
}

function FranchiseView({ franchise }: { franchise: Franchise }) {
  usePageTitle(franchise.displayName);
  const { user, profile } = useAuth();
  const toast = useToast();
  const region = (profile.preferences?.region ?? "US").toUpperCase();
  const seen = useSeenMovies(user!.uid, toast);
  const { watched, markWatched } = useCollectionProgress();
  const [rating, setRating] = useState<MovieRef | null>(null);
  const [open, setOpen] = useState<Movie | null>(null);
  const p = franchiseProgress(franchise, watched);

  // Rating a film here also ticks it off the franchise (users/{uid}.collectionWatchedMovies, as on iOS).
  const rate = async (movie: MovieRef, value: number): Promise<boolean> => {
    if (!(await seen.rate(movie, value))) return false;
    if (!watched.has(movie.id)) {
      try {
        await markWatched(movie.id);
      } catch (err) {
        console.error("Failed to update collection progress", err);
        toast("error", "Rated, but couldn't update your collection progress.");
      }
    }
    return true;
  };

  return (
    <AppShell>
      <main className="col">
        <Link to="/app/collections" className="col__back">‹ Collections</Link>
        <header className="col__head">
          <h1>{franchise.displayName}</h1>
          <p>{p.watched} of {p.total} watched · {p.percent}%</p>
          <ProgressBar value={p.watched} max={p.total} label={`${franchise.displayName} progress`} />
          {franchise.overview && <p className="col__overview">{franchise.overview}</p>}
        </header>

        <ol className="col__parts">
          {franchise.parts.map((part, i) => {
            const done = watched.has(part.id);
            const src = posterUrl(part.posterPath, "w185");
            const meta = [releaseYear(part.releaseDate), part.voteAverage > 0 ? `★ ${part.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ");
            return (
              <li key={part.id} className="col__part">
                <button
                  type="button"
                  className={`col__tick${done ? " is-done" : ""}`}
                  aria-label={done ? `Update your rating for ${part.title}` : `Rate ${part.title} and mark as watched`}
                  onClick={() => setRating(toMovie(part))}
                  disabled={!seen.ready}
                >
                  {done ? "✓" : i + 1}
                </button>
                <button type="button" className="col__film" onClick={() => setOpen(toMovie(part))}>
                  {src ? <img src={src} alt="" loading="lazy" /> : <span className="col__blank" aria-hidden="true" />}
                  <span className="col__film-text">
                    <strong>{part.title}</strong>
                    {meta && <small>{meta}</small>}
                    {done && <small className="col__watched">Watched</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </main>

      <RatingDialog movie={rating} initialRating={rating ? seen.ratingOf(rating.id) ?? 0 : 0} onClose={() => setRating(null)} onRate={(m, r) => void rate(m, r)} />
      <MovieDetailDialog
        movie={open}
        region={region}
        status={open ? (watched.has(open.id) ? "watched" : seen.statusOf(open.id)) : null}
        onClose={() => setOpen(null)}
        onSave={seen.saveForLater}
        onWatched={rate}
      />
    </AppShell>
  );
}
