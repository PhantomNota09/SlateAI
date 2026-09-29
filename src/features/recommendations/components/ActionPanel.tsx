import { posterUrl, releaseYear, type Movie } from "../../../core/models/Movie";
import { Button } from "../../../core/components/Button";

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const CHECK = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.5 12.5 11 15l4.5-5";
const BOOKMARK = "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1Z";
const THUMB_DOWN = "M10 15V19a2 2 0 0 0 2 2l4-9V3H6.7a2 2 0 0 0-2 1.7l-1.2 8A2 2 0 0 0 5.5 15H10Z";
const SKIP = "M5 5l9 7-9 7V5ZM19 5v14";

export function ActionPanel({
  movie,
  upNext,
  onWatched,
  onSave,
  onDismiss,
  onSkip,
}: {
  movie: Movie;
  upNext: Movie[];
  onWatched: () => void;
  onSave: () => void;
  onDismiss: () => void;
  onSkip: () => void;
}) {
  return (
    <aside className="actions" aria-label={`Actions for ${movie.title}`}>
      <div className="actions__card">
        <Button icon={icon(CHECK)} onClick={onWatched}>
          Already watched?
        </Button>
        <Button variant="ghost" icon={icon(BOOKMARK)} onClick={onSave}>
          Watch Later
        </Button>
        <div className="actions__row">
          <Button variant="ghost" icon={icon(THUMB_DOWN)} onClick={onDismiss}>
            Not for me
          </Button>
          <Button variant="ghost" icon={icon(SKIP)} onClick={onSkip}>
            Skip
          </Button>
        </div>
        <p className="actions__keys" aria-hidden="true">
          <kbd>R</kbd> rate · <kbd>W</kbd> save · <kbd>N</kbd> not for me · <kbd>S</kbd> skip
        </p>
      </div>

      {upNext.length > 0 && (
        <div className="upnext">
          <h2>Up next</h2>
          <ul>
            {upNext.map((m) => (
              <li key={m.id}>
                {posterUrl(m.posterPath, "w185") ? <img src={posterUrl(m.posterPath, "w185")!} alt="" loading="lazy" /> : <span className="upnext__blank" />}
                <span>
                  <strong>{m.title}</strong>
                  <small>{[releaseYear(m.releaseDate), m.voteAverage ? `★ ${m.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ")}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
