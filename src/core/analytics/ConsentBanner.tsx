import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { initAnalytics, track } from "./analytics";
import { OPEN_SETTINGS, privacySignalOptOut, readConsent, writeConsent } from "./consent";
import "./ConsentBanner.css";

// Asks once, and offers a way to change the answer later (footer "Analytics settings").
// Also reports a page view on every route change, which does nothing until consent is given.
export function ConsentBanner() {
  const [open, setOpen] = useState(() => readConsent() === null);
  const { pathname } = useLocation();

  useEffect(() => {
    initAnalytics();
    const reopen = () => !privacySignalOptOut() && setOpen(true);
    window.addEventListener(OPEN_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS, reopen);
  }, []);

  useEffect(() => {
    track({ name: "page_view", params: { page_path: pathname } });
  }, [pathname]);

  if (!open) return null;

  const choose = (value: "granted" | "denied") => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <aside className="consent" role="dialog" aria-label="Analytics preferences" aria-describedby="consent-text">
      <p id="consent-text">
        Can we use anonymous analytics to see which parts of Slate people use? It helps us improve the product. No ads, and we never
        sell your data. See our <Link to="/privacy">Privacy Policy</Link>.
      </p>
      <div className="consent__actions">
        <button type="button" className="consent__btn" onClick={() => choose("denied")}>
          No thanks
        </button>
        <button type="button" className="consent__btn consent__btn--primary" onClick={() => choose("granted")}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
