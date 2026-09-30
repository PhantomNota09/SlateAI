import { useEffect, useRef, useState } from 'react';
import { DISMISS_REASONS, filmById } from './data';
import { MatchRing, PosterArt } from './Bits';
import { Reveal } from './useReveal';

const DECK = ['knivesout', 'darkknight', 'getout', 'lalaland'].map(filmById);

export default function Dismiss() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [toast, setToast] = useState(false);
  const timers = useRef([]);
  const film = DECK[index % DECK.length];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    setToast(true);
    timers.current.push(
      setTimeout(() => {
        setIndex((i) => i + 1);
        setLeaving(false);
      }, 520),
      setTimeout(() => setToast(false), 1900),
    );
  };

  return (
    <section className="lp-section" id="no" aria-labelledby="no-title">
      <div className="lp-wrap lp-split">
        <Reveal className="lp-split__copy">
          <p className="lp-take">Take 3</p>
          <h2 id="no-title" className="lp-h2">
            Say no. Say why.
            <br />
            It’s gone for <em>good.</em>
          </h2>
          <p className="lp-lede">
            Not for you? Tap “Not for me” and pick a reason. The movie never comes back, and your answers tell Slate what to stop
            showing you. No endless scroll past things you’ve already ruled out.
          </p>
          <p className="lp-fine">Try it: pick a reason on the card.</p>
        </Reveal>

        <Reveal className="lp-deck-wrap" delay={120}>
          <div className="lp-deck">
            <div className="lp-deck__ghost" aria-hidden="true" />
            <div key={index} className={`lp-dcard ${leaving ? 'is-leaving' : ''}`}>
              <PosterArt film={film} size="lg" />
              <div className="lp-dcard__body">
                <div className="lp-dcard__title">
                  <div>
                    <strong>{film.title}</strong>
                    <span>{film.year} · {film.runtime} min · {film.genres.slice(0, 2).join(' / ')}</span>
                  </div>
                  <MatchRing value={64} size={46} />
                </div>
                <p className="lp-dcard__ask">Why not interested?</p>
                <div className="lp-reasons">
                  {DISMISS_REASONS.map((r) => (
                    <button key={r} type="button" className="lp-reason" onClick={dismiss} disabled={leaving}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className={`lp-toast ${toast ? 'is-on' : ''}`} role="status">
              {toast ? 'Got it: improving your picks' : ''}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
