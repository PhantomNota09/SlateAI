import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_STORE_URL } from './Bits';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="lp-wrap lp-nav__inner">
        <a href="#top" className="lp-brand" aria-label="Slate, back to top">
          <img src="/logo.png" alt="" width="28" height="29" />
          <span>Slate</span>
        </a>
        <nav className="lp-nav__links" aria-label="Sections">
          <a href="#taste">Try it</a>
          <a href="#why">How it decides</a>
          <a href="#streaks">Streaks</a>
          <a href="#everywhere">iPhone &amp; Web</a>
        </nav>
        <div className="lp-nav__cta">
          <Link to="/app/sign-in" className="lp-nav__signin">Sign in</Link>
          <a href={APP_STORE_URL} className="lp-btn lp-btn--small" target="_blank" rel="noopener noreferrer">Download</a>
        </div>
      </div>
    </header>
  );
}
