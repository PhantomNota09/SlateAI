import { GENRES } from "../../../core/models/genres";
import { posterUrl, releaseYear, type MatchInfo, type Movie } from "../../../core/models/Movie";
import type { MovieDetail } from "../../../core/models/MovieDetail";
import { Spinner } from "../../../core/components/Spinner";
import { MatchCard } from "./MatchCard";

const TMDB_IMG = "https://image.tmdb.org/t/p";

function languageName(code: string | null): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? null;
  } catch {
    return null;
  }
}

export function MovieInfo({
  movie,
  detail,
  loading,
  match,
}: {
  movie: Movie;
  detail: MovieDetail | null;
  loading: boolean;
  match: MatchInfo | null;
}) {
  const year = releaseYear(detail?.releaseDate ?? movie.releaseDate);
  const runtime = detail?.runtime ?? movie.runtime;
  const rating = detail?.voteAverage ?? movie.voteAverage;
  const genres = detail?.genres.length
    ? detail.genres.map((g) => g.name)
    : movie.genreIds.map((id) => GENRES.find((g) => g.id === id)?.name).filter(Boolean) as string[];
  const overview = detail?.overview || movie.overview;
  const language = languageName(detail?.originalLanguage ?? movie.originalLanguage);
  const countries = detail?.countries.slice(0, 2).join(", ");
  const providers = detail?.providers;
  const cast = detail?.cast.slice(0, 6) ?? [];

  return (
    <div className="info">
      <header className="info__head">
        <h1 className="info__title">{movie.title}</h1>
        <p className="info__meta">
          {year && <span>{year}</span>}
          {runtime ? <span>{runtime} min</span> : null}
          {rating > 0 && (
            <span className="info__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z" />
              </svg>
              {rating.toFixed(1)}
            </span>
          )}
        </p>
        {(countries || language) && (
          <p className="info__sub">{[countries, language].filter(Boolean).join(" · ")}</p>
        )}
        {genres.length > 0 && (
          <ul className="info__genres" aria-label="Genres">
            {genres.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </header>

      {movie.onSelectedServices === false && (
        <p className="info__notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8v.01" />
          </svg>
          Availability on your streaming services isn't confirmed for this one.
        </p>
      )}

      {match && <MatchCard info={match} />}

      {overview && (
        <section className="info__section">
          <h2>Overview</h2>
          <p className="info__overview">{overview}</p>
        </section>
      )}

      {loading && !detail && (
        <p className="info__loading">
          <Spinner size="sm" /> Loading details…
        </p>
      )}

      {providers && (providers.stream.length > 0 || providers.rentOrBuy.length > 0) && (
        <section className="info__section">
          <h2>Where to watch</h2>
          <div className="providers">
            {providers.stream.length > 0 && <ProviderRow title="Stream" items={providers.stream} link={providers.link} />}
            {providers.rentOrBuy.length > 0 && <ProviderRow title="Rent or buy" items={providers.rentOrBuy} link={providers.link} />}
          </div>
          {providers.link && (
            <a className="info__attrib" href={providers.link} target="_blank" rel="noopener noreferrer">
              Powered by JustWatch ↗
            </a>
          )}
        </section>
      )}

      {cast.length > 0 && (
        <section className="info__section">
          <h2>Cast</h2>
          <ul className="cast">
            {cast.map((c) => (
              <li key={c.id}>
                {c.profilePath ? (
                  <img src={`${TMDB_IMG}/w185${c.profilePath}`} alt="" loading="lazy" />
                ) : (
                  <span className="cast__blank" aria-hidden="true" />
                )}
                <span>
                  <strong>{c.name}</strong>
                  {c.character && <small>{c.character}</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProviderRow({
  title,
  items,
  link,
}: {
  title: string;
  items: { id: number; name: string; logoPath: string | null }[];
  link: string | null;
}) {
  return (
    <div className="providers__row">
      <h3>{title}</h3>
      <ul>
        {items.slice(0, 8).map((p) => (
          <li key={p.id}>
            <a href={link ?? undefined} target="_blank" rel="noopener noreferrer" title={p.name}>
              {p.logoPath ? <img src={`${TMDB_IMG}/w92${p.logoPath}`} alt={p.name} loading="lazy" /> : <span>{p.name}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Re-exported so the page can show a poster in "Up next" without another import.
export { posterUrl };
