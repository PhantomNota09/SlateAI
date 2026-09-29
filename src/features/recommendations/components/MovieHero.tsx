import { backdropUrl, posterUrl, type Movie } from "../../../core/models/Movie";
import type { MovieDetail } from "../../../core/models/MovieDetail";

export function MovieHero({
  movie,
  detail,
  onPlayTrailer,
}: {
  movie: Movie;
  detail: MovieDetail | null;
  onPlayTrailer: () => void;
}) {
  const image = backdropUrl(detail?.backdropPath ?? movie.backdropPath) ?? posterUrl(movie.posterPath);
  return (
    <div className="movie-hero">
      {image ? <img key={image} className="movie-hero__image" src={image} alt="" /> : <div className="movie-hero__fallback" />}
      <div className="movie-hero__scrim" />
      {detail?.trailerKey && (
        <button type="button" className="movie-hero__play" onClick={onPlayTrailer} aria-label={`Play trailer for ${movie.title}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
          <span>Watch trailer</span>
        </button>
      )}
    </div>
  );
}
