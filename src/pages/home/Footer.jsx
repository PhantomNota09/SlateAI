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
    </footer>
  );
}
