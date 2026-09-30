import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__inner">
        <div className="lp-brand">
          <img src="/logo.png" alt="" width="24" height="25" />
          <span>Slate AI</span>
        </div>
        <nav className="lp-footer__links" aria-label="Legal and contact">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <a href="mailto:slateai09@gmail.com">Contact</a>
        </nav>
        <p>© 2026 Slate. All rights reserved.</p>
      </div>
      <div className="lp-wrap lp-footer__credit">
        <img src="/tmdb-logo.svg" alt="TMDB" height="12" />
        <p>
          This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB. Movie posters
          are shown for illustration and belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
