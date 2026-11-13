import { useState } from "react";
import { Button } from "../../../core/components/Button";
import { Modal } from "../../../core/components/Modal";
import type { Movie, MovieRef } from "../../../core/models/Movie";
import { RatingDialog, TrailerDialog } from "../../recommendations/components/Dialogs";
import { MovieHero } from "../../recommendations/components/MovieHero";
import { MovieInfo } from "../../recommendations/components/MovieInfo";
import { useMovieDetail } from "../../recommendations/hooks/useMovieDetail";
import type { MovieStatus } from "../hooks/useSeenMovies";
import "../../recommendations/components/Recommendations.css";
import "./Discover.css";

// A film's detail view from Discover (iOS DiscoverMovieDetailModal): trailer, details, where to
// watch, and Save to Watch Later / Already watched.
export function MovieDetailDialog({
  movie,
  region,
  status,
  onClose,
  onSave,
  onWatched,
}: {
  movie: Movie | null;
  region: string;
  status: MovieStatus;
  onClose: () => void;
  onSave: (movie: Movie) => Promise<boolean>;
  onWatched: (movie: MovieRef, rating: number) => Promise<boolean>;
}) {
  return (
    <Modal open={!!movie} onClose={onClose} title={movie?.title ?? "Movie details"} size="lg" hideTitle>
      {movie && <Body movie={movie} region={region} status={status} onClose={onClose} onSave={onSave} onWatched={onWatched} />}
    </Modal>
  );
}

function Body({ movie, region, status, onClose, onSave, onWatched }: { movie: Movie; region: string; status: MovieStatus; onClose: () => void; onSave: (m: Movie) => Promise<boolean>; onWatched: (m: MovieRef, r: number) => Promise<boolean> }) {
  const { detail, loading } = useMovieDetail(movie.id, region);
  const [trailer, setTrailer] = useState(false);
  const [rating, setRating] = useState<MovieRef | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await onSave(movie);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="mdd">
      <MovieHero movie={movie} detail={detail} onPlayTrailer={() => setTrailer(true)} />
      <MovieInfo movie={movie} detail={detail} loading={loading} match={null} />

      <div className="mdd__actions">
        {status === "watched" ? (
          <p className="mdd__status">You've already watched this one.</p>
        ) : (
          <>
            <Button onClick={() => setRating({ id: movie.id, title: movie.title, posterPath: movie.posterPath, genreIds: movie.genreIds, originalLanguage: movie.originalLanguage, releaseDate: movie.releaseDate })} disabled={busy}>Already watched</Button>
            {status === "saved" ? (
              <p className="mdd__status">In your Watch Later</p>
            ) : (
              <Button variant="ghost" onClick={() => void save()} loading={busy}>Save to Watch Later</Button>
            )}
          </>
        )}
      </div>

      <TrailerDialog open={trailer} onClose={() => setTrailer(false)} title={movie.title} videoKey={detail?.trailerKey ?? null} />
      <RatingDialog
        movie={rating}
        onClose={() => setRating(null)}
        onRate={(m, r) => {
          void onWatched(m, r).then((ok) => ok && onClose());
        }}
      />
    </div>
  );
}
