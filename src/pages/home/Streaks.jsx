import { useState } from 'react';
import { STREAK_BADGES } from './data';
import { Reveal } from './useReveal';

const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

export default function Streaks() {
  const [days, setDays] = useState(9);
  const next = STREAK_BADGES.find((b) => days < b.days);
  const earned = STREAK_BADGES.filter((b) => days >= b.days).length;

  return (
    <section className="lp-section lp-section--tint" id="streaks" aria-labelledby="streaks-title">
      <div className="lp-wrap lp-streaks">
        <Reveal className="lp-streaks__head">
          <p className="lp-take">Take 4</p>
          <h2 id="streaks-title" className="lp-h2">
            Show up. <em>Earn your credits.</em>
          </h2>
          <p className="lp-lede">
            Rate, save or skip a movie and your streak ticks up. Hit milestones and unlock badges named like the credits roll.
            Drag the slider to see them light up.
          </p>
        </Reveal>

        <Reveal className="lp-streak" delay={100}>
          <div className="lp-streak__count">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={days > 0 ? 'is-live' : ''}>
              <path d={FLAME} />
            </svg>
            <div>
              <strong>{days}</strong>
              <span>day streak</span>
            </div>
          </div>

          <label className="lp-slider">
            <span className="sr-only">Streak length in days</span>
            <input type="range" min="0" max="400" step="1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <p className="lp-streak__next" aria-live="polite">
            {next ? `Next badge: ${next.name} at ${next.days} days (${next.days - days} to go)` : `All ${STREAK_BADGES.length} streak badges unlocked`}
            <span> · {earned}/{STREAK_BADGES.length} earned</span>
          </p>

          <ul className="lp-filmstrip">
            {STREAK_BADGES.map((b) => {
              const on = days >= b.days;
              return (
                <li key={b.id} className={`lp-frame ${on ? 'is-on' : ''}`}>
                  <span className="lp-frame__days">{b.days}</span>
                  <strong>{b.name}</strong>
                  <span>{on ? b.blurb : `Unlocks at ${b.days} days`}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
