import { Button } from "../../../core/components/Button";
import { backdropUrl, releaseYear, type Movie } from "../../../core/models/Movie";

// Featured film: its backdrop with the title and a View details button.
export function HeroBanner({ movie, onOpen }: { movie: Movie; onOpen: (m: Movie) => void }) {
  const image = backdropUrl(movie.backdropPath);
  return (
    <section className="disc__hero" aria-label="Featured">
      <div className="disc__hero-media">
        {image && <img src={image} alt="" />}
        <div className="disc__hero-scrim" />
      </div>
      <div className="disc__hero-body">
        <small>Featured this week</small>
        <h2>{movie.title}</h2>
        <p>{[releaseYear(movie.releaseDate), movie.voteAverage > 0 ? `★ ${movie.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ")}</p>
        <Button onClick={() => onOpen(movie)}>View details</Button>
      </div>
    </section>
  );
}
