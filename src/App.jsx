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
            <img src="/logo.png" alt="Slate AI" className="nav-logo" />
            <span className="nav-text">Slate AI</span>
          </div>
          <a 
            href="https://apps.apple.com/us/app/slate-ai/id6757089643" 
            className="download-btn" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Stop scrolling.<br />
              Start watching.
            </h1>
            <p className="hero-subtitle">
              A custom recommendation engine built to match your taste — 
              learning from what you love and what you don't.
            </p>
            <a 
              href="https://apps.apple.com/us/app/slate-ai/id6757089643" 
              className="hero-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download on the App Store
            </a>
          </div>
          <div className="hero-image">
            <img src="/app-screenshot.png" alt="Slate AI App" className="app-screen" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Set your preferences</h3>
            <p className="step-desc">
              Tell us about your taste — favorite genres, themes you enjoy, 
              release preferences, and what you want to avoid.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">Get smart recommendations</h3>
            <p className="step-desc">
              Our custom engine analyzes thousands of movies and shows you 
              one perfect pick at a time — no endless scrolling.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Train your engine</h3>
            <p className="step-desc">
              Rate movies you've watched, dismiss what doesn't fit, save for later. 
              The engine learns from both your likes and dislikes to get smarter.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">What makes Slate different</h2>
        <div className="features-grid">
          
          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16S32.837 8 24 8zm0 28c-6.627 0-12-5.373-12-12S17.373 12 24 12s12 5.373 12 12-5.373 12-12 12z" fill="currentColor" opacity="0.3"/>
                <circle cx="24" cy="24" r="6" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Custom recommendation engine</h3>
            <p className="feature-desc">
              Built from scratch to understand your unique taste. Not generic AI — 
              a personalized system that learns from every interaction.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M18 24l6 6 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 24l-6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              </svg>
            </div>
            <h3 className="feature-title">Learns what you don't like</h3>
            <p className="feature-desc">
              Unlike other apps, our engine learns from dismissals and negative feedback — 
              getting better by understanding both sides of your taste.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="18" cy="24" r="6" fill="currentColor" opacity="0.5"/>
                <circle cx="30" cy="24" r="6" fill="currentColor" opacity="0.7"/>
                <circle cx="24" cy="16" r="4" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Connect with friends</h3>
            <p className="feature-desc">
              Add friends, compare tastes, and see what they're watching. 
              Share your cinema profile and discover movies together.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="12" y="12" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <rect x="16" y="16" width="16" height="16" rx="2" fill="currentColor" opacity="0.5"/>
                <path d="M20 24h8M24 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Letterboxd sync</h3>
            <p className="feature-desc">
              Connect your Letterboxd account to automatically import your watch history. 
              Your ratings help personalize recommendations from day one.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="10" y="14" width="12" height="20" rx="2" fill="currentColor" opacity="0.4"/>
                <rect x="26" y="10" width="12" height="24" rx="2" fill="currentColor" opacity="0.6"/>
                <rect x="18" y="18" width="12" height="16" rx="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Franchise collections</h3>
            <p className="feature-desc">
              Browse complete franchises like MCU, Star Wars, Harry Potter, and more. 
              Track what you've watched and discover what's next.
            </p>
          </div>

          <div className="feature">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M24 14v10l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="feature-title">Always free</h3>
            <p className="feature-desc">
              No subscriptions, no ads, no tracking. 
              Just personalized movie recommendations that get better every day.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">Ready to find movies you'll actually love?</h2>
        <a 
          href="https://apps.apple.com/us/app/slate-ai/id6757089643" 
          className="cta-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download on the App Store
        </a>
        <p className="cta-subtitle">Free forever.</p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="Slate AI" className="footer-logo" />
            <span>Slate AI</span>
          </div>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <a href="mailto:slateai09@gmail.com">Contact</a>
          </div>
          <p className="footer-copyright">© 2025 Slate AI. All rights reserved.</p>
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