import "./components.css";

// Required wherever TMDB data (posters, details) is shown (spec §9).
export function TmdbAttribution() {
  return (
    <footer className="tmdb">
      <img src="/tmdb-logo.svg" alt="TMDB" height="12" />
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </footer>
  );
}
