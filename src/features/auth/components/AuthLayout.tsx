import type { ReactNode } from "react";
import { BrandMark } from "../../../core/components/BrandMark";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { TMDB_IMG, filmById } from "../../../shared/demoFilms";
import "./AuthLayout.css";

// Split-screen shell for every unauthenticated /app screen: form on the left, brand
// panel on the right (hidden on small screens, where the brand sits above the form).
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-main__inner">
          <a href="/" className="auth-main__brand" aria-label="Slate home">
            <BrandMark />
          </a>
          {children}
        </div>
      </main>
      <BrandPanel />
    </div>
  );
}

// Brand panel (desktop only). This is the WEB app's sign-in screen, so it shows what the web app
// actually is (a pick with its reasons), not an iPhone screenshot. The pick is an illustration:
// the score is a demo number. Decorative except for the header.
const PICK = filmById("inception");
const PICK_SCORE = 87;

function BrandPanel() {
  return (
    <aside className="auth-panel">
      <div className="auth-panel__lockup">
        <img src="/slate-logo.png" alt="" className="auth-panel__logo" />
        <span className="auth-panel__name">Slate AI</span>
      </div>

      <div className="auth-panel__center">
        <h2 className="auth-panel__headline">
          Stop scrolling,
          <br />
          start watching.
        </h2>
        <p className="auth-panel__sub">Free · No ads · No subscriptions</p>

        <div className="auth-pick" aria-hidden="true">
          <img
            className="auth-pick__poster"
            src={`${TMDB_IMG}/w342${PICK.poster}`}
            alt=""
            width="120"
            height="174"
          />
          <div className="auth-pick__body">
            <strong>{PICK.title}</strong>
            <span>
              {PICK.year} · {PICK.runtime} min · {PICK.genres.join(" / ")}
            </span>
            <div className="auth-pick__match">
              <span className="auth-pick__ring" style={{ ["--pct" as string]: `${PICK_SCORE}%` }}>
                <span>
                  {PICK_SCORE}
                  <small>%</small>
                </span>
              </span>
              <em>Why this pick</em>
            </div>
            <ul className="auth-pick__why">
              <li>Matches your love of Sci-Fi, Action</li>
              <li>Exceptional {PICK.rating.toFixed(1)} rating</li>
            </ul>
          </div>
        </div>
        <p className="auth-panel__note">Illustrative pick. Yours come from your own taste.</p>
      </div>

      <div className="auth-panel__credit">
        <TmdbAttribution />
      </div>
    </aside>
  );
}
