import { Link } from "react-router-dom";
import { openConsentSettings } from "../analytics/consent";
import { BrandMark } from "./BrandMark";
import { TmdbAttribution } from "./TmdbAttribution";
import "./components.css";

// One footer for every signed-in screen (rendered by AppShell): brand, legal links, copyright and
// the TMDB notice TMDB's terms require wherever its data is shown.
export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__top">
          <Link to="/" className="app-footer__brand" aria-label="Slate">
            <BrandMark />
          </Link>
          <nav className="app-footer__links" aria-label="Legal and contact">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <a href="mailto:slateai09@gmail.com">Contact</a>
            <button type="button" onClick={openConsentSettings}>Analytics settings</button>
          </nav>
        </div>
        <div className="app-footer__bottom">
          <TmdbAttribution />
          <p className="app-footer__copy">© {new Date().getFullYear()} Slate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
