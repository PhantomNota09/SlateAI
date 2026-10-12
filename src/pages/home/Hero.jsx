import { useState } from 'react';
import { filmById } from './data';
import { AppStoreBadge, MatchRing, PosterArt, WebAppLink } from './Bits';

// Five illustrative picks the slate cycles through. Scores sit in the range the real engine
// produces for good fits (roughly 40-90%), not an inflated 99%.
const PICK_SCORES = [['inception', 87], ['lalaland', 82], ['parasite', 79], ['spirited', 76], ['knivesout', 71]];
const PICKS = PICK_SCORES.map(([id, score]) => {
  const film = filmById(id);
  return { film, score, reason: `Matches your love of ${film.genres.slice(0, 2).join(', ')}` };
});

const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Hero() {
  const [take, setTake] = useState(1);
  const [locked, setLocked] = useState(false);
  const pick = PICKS[(take - 1) % PICKS.length];

  const nextTake = () => {
    setTake((t) => t + 1);
    setLocked(false);
  };

  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero__glow" aria-hidden="true" />
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__copy">
          <p className="lp-eyebrow">Movie picks, one take at a time</p>
          <h1 className="lp-hero__title">
            Stop scrolling.
            <br />
            Start <em>watching.</em>
          </h1>
          <p className="lp-hero__lede">
            Slate learns your taste and hands you one great movie at a time, with the reason it picked it. Free, no ads, no
            subscriptions.
          </p>
          <div className="lp-hero__actions">
            <AppStoreBadge />
            <WebAppLink />
          </div>
        </div>

        <div className="lp-hero__stage">
          <div className="lp-slate" role="group" aria-label="A sample pick on a clapperboard. Illustrative.">
            <div className="lp-slate__sticks" aria-hidden="true">
              <div key={take} className="lp-slate__arm" />
              <div className="lp-slate__stick" />
            </div>
            <div className="lp-slate__board">
              <span key={`flash-${take}`} className="lp-slate__flash" aria-hidden="true" />
              <dl className="lp-slate__meta">
                <div><dt>Prod.</dt><dd>Slate</dd></div>
                <div><dt>Scene</dt><dd>Tonight</dd></div>
                <div><dt>Take</dt><dd className="lp-slate__take" aria-live="polite">{take}</dd></div>
                <div><dt>Roll</dt><dd>Your taste</dd></div>
                <div><dt>Dir.</dt><dd>You</dd></div>
                <div><dt>Date</dt><dd>{today}</dd></div>
              </dl>

              <div className="lp-pick" key={pick.film.id}>
                <PosterArt film={pick.film} size="md" eager />
                <div className="lp-pick__body">
                  <h2>{pick.film.title}</h2>
                  <p className="lp-pick__meta">
                    {pick.film.year} · {pick.film.runtime} min · {pick.film.genres.slice(0, 2).join(' / ')}
                  </p>
                  <div className="lp-pick__match">
                    <MatchRing value={pick.score} />
                    <p>
                      <strong>Why this pick</strong>
                      <span>{pick.reason}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="lp-slate__actions">
                <button type="button" className="lp-btn" onClick={() => setLocked(true)} disabled={locked}>
                  {locked ? 'Locked in for tonight ✓' : 'Watch tonight'}
                </button>
                <button type="button" className="lp-btn lp-btn--ghost" onClick={nextTake}>
                  Next take <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>
          </div>
          <p className="lp-caption">Illustrative picks. Yours come from your own taste. Posters via TMDB.</p>
        </div>
      </div>
    </section>
  );
}
