import { posterUrl, releaseYear, type Movie } from "../../../core/models/Movie";

// Poster card used in Discover rows, See all and search results.
export function MovieCard({ movie, rank, onOpen }: { movie: Movie; rank?: number; onOpen: (movie: Movie) => void }) {
  const src = posterUrl(movie.posterPath, "w342");
  const meta = [releaseYear(movie.releaseDate), movie.voteAverage > 0 ? `★ ${movie.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ");
  return (
    <button type="button" className={`dcard${rank ? " dcard--ranked" : ""}`} onClick={() => onOpen(movie)} aria-label={`${movie.title}${meta ? `, ${meta}` : ""}`}>
      {rank && <span className="dcard__rank" aria-hidden="true">{rank}</span>}
      {src ? <img src={src} alt="" loading="lazy" /> : <span className="dcard__blank" aria-hidden="true" />}
      <strong>{movie.title}</strong>
      {meta && <small>{meta}</small>}
    </button>
  );
}
