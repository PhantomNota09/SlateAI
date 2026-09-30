import { useState } from 'react';
import { FACTORS, FILMS, SAMPLE_REASONS } from './data';
import { Check, MatchRing, PosterArt } from './Bits';
import { Reveal, useReveal } from './useReveal';

export default function WhyBoard() {
  const [active, setActive] = useState('genres');
  const [boardRef, seen] = useReveal(0.3);
  const factor = FACTORS.find((f) => f.id === active);

  return (
    <section className="lp-section lp-section--tint" id="why" aria-labelledby="why-title">
      <div className="lp-wrap lp-split lp-split--flip">
        <Reveal className="lp-split__copy">
          <p className="lp-take">Take 2</p>
          <h2 id="why-title" className="lp-h2">
            A match score
            <br />
            you can actually <em>read.</em>
          </h2>
          <p className="lp-lede">
            No black box. Every pick comes with its reasons, and the score is built from the things you told us: your genres,
            your history, your themes, your language, how picky you are.
          </p>

          <div className="lp-board" ref={boardRef} role="group" aria-label="What goes into a match, in rough order of weight">
            {FACTORS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className={`lp-fader ${active === f.id ? 'is-active' : ''}`}
                onClick={() => setActive(f.id)}
                aria-pressed={active === f.id}
              >
                <span className="lp-fader__label">{f.label}</span>
                <span className="lp-fader__track" aria-hidden="true">
                  <span className="lp-fader__fill" style={{ '--w': seen ? `${f.weight * 100}%` : '0%', '--i': i }} />
                </span>
              </button>
            ))}
          </div>
          <p className="lp-fader__note" aria-live="polite">{factor.note}</p>
          <p className="lp-fine">Bars show roughly how much each factor counts.</p>
        </Reveal>

        <Reveal className="lp-why-card-wrap" delay={120}>
          <div className="lp-why-card">
            <div className="lp-why-card__head">
              <PosterArt film={FILMS[0]} size="sm" />
              <div>
                <strong>{FILMS[0].title}</strong>
                <span>{FILMS[0].year} · {FILMS[0].runtime} min</span>
              </div>
              <MatchRing value={87} size={58} />
            </div>
            <p className="lp-why-card__title">Why this pick</p>
            <ul>
              {SAMPLE_REASONS.map((r, i) => (
                <li key={r} style={{ '--i': i }}>
                  <Check /> {r}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
