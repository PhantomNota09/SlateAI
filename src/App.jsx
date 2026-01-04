import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';

function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
          <div className="nav-brand">
            <img src="/logo.png" alt="Slate" className="nav-logo" />
            <span className="nav-text">Slate AI</span>
          </div>
          <a href="https://testflight.apple.com/join/7wCx3GHY" className="download-btn" target="_blank" rel="noopener noreferrer">
            Try Beta
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="movie-bg">
          <div className="film-reel reel-1"></div>
          <div className="film-reel reel-2"></div>
          <div className="film-strip strip-1"></div>
          <div className="film-strip strip-2"></div>
        </div>

        <div className="hero-grid">
          <div className="hero-text">
            <h1 className="hero-title">
              Stop<br />
              scrolling.<br />
              Start<br />
              watching.
            </h1>
            <p className="hero-subtitle">AI-powered movie picks that actually match your taste</p>
          </div>
          <div className="hero-image">
            <img src="/app-screenshot.png" alt="Slate App" className="app-screen" />
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="statement">
        <h2 className="statement-text">
          Your perfect top 10.<br />
          Zero effort.
        </h2>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-container">
          
          <div className="feature-card gradient-purple">
            <div className="card-graphic">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <circle cx="40" cy="40" r="20" fill="currentColor" opacity="0.6"/>
                <circle cx="40" cy="40" r="10" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="card-title">Hyper-Personalized</h3>
            <p className="card-desc">AI that learns your unique taste, not just genres</p>
          </div>

          <div className="feature-card gradient-green">
            <div className="card-graphic">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M20 40L35 55L60 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              </svg>
            </div>
            <h3 className="card-title">Top 10 Only</h3>
            <p className="card-desc">Curated picks, no endless scrolling</p>
          </div>

          <div className="feature-card gradient-orange">
            <div className="card-graphic">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="25" y="25" width="30" height="30" rx="5" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <rect x="30" y="30" width="20" height="20" rx="3" fill="currentColor" opacity="0.6"/>
                <circle cx="40" cy="40" r="5" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="card-title">Always Free</h3>
            <p className="card-desc">No ads, no tracking, no BS</p>
          </div>

          <div className="feature-card gradient-blue">
            <div className="card-graphic">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <polygon points="30,20 30,60 55,40" fill="currentColor" opacity="0.6"/>
                <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              </svg>
            </div>
            <h3 className="card-title">2-Min Setup</h3>
            <p className="card-desc">Answer 8 questions, start discovering</p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">Ready?</h2>
        <a href="https://testflight.apple.com/join/7wCx3GHY" className="cta-button" target="_blank" rel="noopener noreferrer">
          Beta Version
        </a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 Slate</p>
          <div className="footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <a href="mailto:phantomnota09@gmail.com">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;