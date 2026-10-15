import "./components.css";

// Required wherever TMDB data (posters, details) is shown (spec §9). The wording is the notice
// TMDB's API terms currently prescribe; keep it verbatim. Signed-in screens get it from AppFooter;
// the sign-in screen, which has no app footer, shows it directly.
export function TmdbAttribution() {
  return (
    <div className="tmdb">
      <img src="/tmdb-logo.svg" alt="TMDB" height="12" />
      <p>This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</p>
    </div>
  );
}
