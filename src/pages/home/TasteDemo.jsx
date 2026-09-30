import { useMemo, useState } from 'react';
import { DEMO_GENRES, FILMS } from './data';
import { MAX_PER_LIST, rankFilms, toggleGenre } from './tasteRanking';
import { MatchRing, PosterArt } from './Bits';
import { Reveal } from './useReveal';

export default function TasteDemo() {
  const [loves, setLoves] = useState(['Sci-Fi', 'Action']);
  const [avoids, setAvoids] = useState([]);
  const ranked = useMemo(() => rankFilms(FILMS, loves, avoids), [loves, avoids]);
  const byId = Object.fromEntries(ranked.map((r) => [r.film.id, r]));
  const top = ranked.find((r) => !r.hidden);

  const pickLove = (g) => {
    const r = toggleGenre(loves, g, avoids);
    setLoves(r.list);
    setAvoids(r.other);
  };
  const pickAvoid = (g) => {
    const r = toggleGenre(avoids, g, loves);
    setAvoids(r.list);
    setLoves(r.other);
  };

  return (
    <section className="lp-section" id="taste" aria-labelledby="taste-title">
      <div className="lp-wrap lp-split">
        <Reveal className="lp-split__copy">
          <p className="lp-take">Take 1</p>
          <h2 id="taste-title" className="lp-h2">
            Tap what you love.
            <br />
            Watch your picks <em>rearrange.</em>
          </h2>
          <p className="lp-lede">
            That’s what onboarding does in the app: pick up to three genres you love and up to three you never want to see.
            Favorites lift a movie. Avoided genres remove it for good.
          </p>

          <div className="lp-chipgroup">
            <p id="loves-label" className="lp-chipgroup__label">I love</p>
            <div className="lp-chips" role="group" aria-labelledby="loves-label">
              {DEMO_GENRES.map((g) => (
                <button key={g} type="button" className="lp-chip" aria-pressed={loves.includes(g)} onClick={() => pickLove(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="lp-chipgroup">
            <p id="avoids-label" className="lp-chipgroup__label">Not for me</p>
            <div className="lp-chips lp-chips--avoid" role="group" aria-labelledby="avoids-label">
              {DEMO_GENRES.map((g) => (
                <button key={g} type="button" className="lp-chip" aria-pressed={avoids.includes(g)} onClick={() => pickAvoid(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <p className="lp-fine">Up to {MAX_PER_LIST} each. Example movies with illustrative scores. Your real picks come from Slate’s recommendation engine.</p>
        </Reveal>

        <Reveal className="lp-ranks-wrap" delay={120}>
          <ol className="lp-ranks" style={{ '--n': FILMS.length }}>
            {FILMS.map((f) => {
              const r = byId[f.id];
              return (
                <li key={f.id} className={`lp-rank ${r.hidden ? 'is-hidden' : ''}`} style={{ '--rank': r.rank }}>
                  <PosterArt film={f} size="sm" />
                  <div className="lp-rank__body">
                    <strong>{f.title}</strong>
                    <span>{r.hidden ? 'Filtered out: you said not for me' : r.reasons[0]}</span>
                  </div>
                  {r.hidden ? <span className="lp-rank__gone">Hidden</span> : <MatchRing value={r.score} size={46} />}
                </li>
              );
            })}
          </ol>
          <p className="sr-only" aria-live="polite">
            {top ? `Top pick: ${top.film.title}, ${top.score}% match.` : 'Every film is filtered out.'}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
