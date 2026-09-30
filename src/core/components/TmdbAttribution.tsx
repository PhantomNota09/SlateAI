import "./components.css";

// Required wherever TMDB data (posters, details) is shown (spec §9). The wording is the notice
// TMDB's API terms currently prescribe; keep it verbatim.
export function TmdbAttribution() {
  return (
    <footer className="tmdb">
      <img src="/tmdb-logo.svg" alt="TMDB" height="12" />
      <p>This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</p>
    </footer>
  );
}
