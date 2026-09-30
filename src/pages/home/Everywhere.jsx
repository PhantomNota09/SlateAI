import { FILMS } from './data';
import { AppStoreBadge, MatchRing, PosterArt, WebAppLink } from './Bits';
import { Reveal } from './useReveal';

function MiniPick({ film, score, compact }) {
  return (
    <div className={`lp-mini ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <PosterArt film={film} size={compact ? 'sm' : 'lg'} />
      <div className="lp-mini__body">
        <strong>{film.title}</strong>
        <span>{film.year} · {film.runtime} min</span>
        <div className="lp-mini__row">
          <MatchRing value={score} size={38} />
          <em>Why this pick</em>
        </div>
        <div className="lp-mini__btns">
          <i>Already watched?</i>
          <i className="is-ghost">Watch Later</i>
        </div>
      </div>
    </div>
  );
}

export default function Everywhere() {
  return (
    <section className="lp-section" id="everywhere" aria-labelledby="everywhere-title">
      <div className="lp-wrap">
        <Reveal className="lp-center">
          <p className="lp-take">One account, every screen</p>
          <h2 id="everywhere-title" className="lp-h2">
            Start on your phone.
            <br />
            Pick up on the <em>web.</em>
          </h2>
          <p className="lp-lede lp-lede--center">
            Slate runs on iPhone and in your browser, on the same account. Your taste, your ratings, your Watch Later list and your
            streak follow you, so a rating on the couch counts at your desk.
          </p>
        </Reveal>

        <Reveal className="lp-devices" delay={100}>
          <div className="lp-browser">
            <div className="lp-browser__bar" aria-hidden="true">
              <span /><span /><span />
              <em>Slate on the web</em>
            </div>
            <div className="lp-browser__body">
              <MiniPick film={FILMS[0]} score={87} />
            </div>
          </div>
          <div className="lp-phone">
            <div className="lp-phone__notch" aria-hidden="true" />
            <div className="lp-phone__screen">
              <MiniPick film={FILMS[6]} score={82} compact />
            </div>
          </div>
        </Reveal>

        <Reveal className="lp-center lp-cta-row" delay={160}>
          <AppStoreBadge />
          <WebAppLink>Open the web app</WebAppLink>
        </Reveal>
      </div>
    </section>
  );
}
