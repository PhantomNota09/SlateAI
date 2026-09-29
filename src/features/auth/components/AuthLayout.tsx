import type { ReactNode } from "react";
import { BrandMark } from "../../../core/components/BrandMark";
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

// Brand panel (desktop only): product header, the quote, and the real app rising from the
// bottom edge. Decorative except for the header.
function BrandPanel() {
  return (
    <aside className="auth-panel">
      <div className="auth-panel__lockup">
        <img src="/slate-logo.png" alt="" className="auth-panel__logo" />
        <span className="auth-panel__name">Slate AI</span>
      </div>

      <div className="auth-panel__copy">
        <h2 className="auth-panel__headline">
          Stop scrolling,
          <br />
          start watching.
        </h2>
        <p className="auth-panel__sub">Free · No ads · No subscriptions</p>
      </div>

      <div className="auth-panel__stage" aria-hidden="true">
        <img src="/app-screenshot.png" alt="" className="auth-panel__phone" />
      </div>
    </aside>
  );
}
