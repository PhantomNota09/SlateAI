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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.5 5 18.5 12 7.5 19Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
