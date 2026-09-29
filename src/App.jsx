import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { AuthProvider } from './features/auth/context/AuthContext';
import { SignInPage } from './features/auth/components/SignInPage';
import { SignUpPage } from './features/auth/components/SignUpPage';
import { ForgotPasswordPage } from './features/auth/components/ForgotPasswordPage';
import { ChooseUsernamePage } from './features/auth/components/ChooseUsernamePage';
import { RecommendationsPage } from './features/recommendations/components/RecommendationsPage';
import { ProfilePage } from './features/profile/components/ProfilePage';
import { ToastProvider } from './core/components/Toast';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { OnboardingPage } from './features/onboarding/components/OnboardingPage';
import './core/theme/tokens.css';
import './App.css';

function AppStoreBadge() {
  return (
    <a
      href="https://apps.apple.com/us/app/slate-ai/id6757089643"
      className="app-store-badge"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <div className="badge-text">
        <span className="badge-label">Download on the</span>
        <span className="badge-store">App Store</span>
      </div>
    </a>
  );
}

function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
          <div className="nav-actions">
            <Link to="/app/sign-in" className="nav-signin-link">
              Sign In
            </Link>
            <a
              href="https://apps.apple.com/us/app/slate-ai/id6757089643"
              className="nav-download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered recommendations
            </div>
            <h1 className="hero-title">
              Stop scrolling.<br />
              Start watching.
            </h1>
            <p className="hero-subtitle">
              A personalized recommendation engine built to match your taste —
              learning from what you love and what you don't.
            </p>
            <div className="hero-actions">
              <AppStoreBadge />
              <span className="hero-free-note">Free · No ads · No subscriptions</span>
            </div>
          </div>
          <div className="hero-image-wrap">
            <div className="phone-glow" />
            <img
              src="/app-screenshot.png"
              alt="Slate AI App"
              className="app-screen"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stats-inner">
          <div className="stat">
            <span className="stat-num">10K+</span>
            <span className="stat-label">Movies & Shows</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">Free</span>
            <span className="stat-label">Always & forever</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">iOS</span>
            <span className="stat-label">App Store</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-inner">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title">Three steps to your perfect pick</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Set your preferences</h3>
              <p className="step-desc">
                Tell us about your taste — favorite genres, themes you enjoy,
                release preferences, and what you want to avoid.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">Get smart recommendations</h3>
              <p className="step-desc">
                Our custom engine analyzes thousands of movies and surfaces one
                perfect pick at a time — no endless browsing.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Train your engine</h3>
              <p className="step-desc">
                Rate, dismiss, save for later. The engine learns from both your
                likes and dislikes to get sharper every session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-inner">
          <p className="section-eyebrow">Features</p>
          <h2 className="section-title">What makes Slate different</h2>
          <div className="features-grid">

            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="feature-title">Custom recommendation engine</h3>
              <p className="feature-desc">
                Built from scratch to understand your unique taste. Not a generic
                algorithm — a personalized system that learns from every interaction.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 6l3-3 3 3M3 18l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                </svg>
              </div>
              <h3 className="feature-title">Learns what you don't like</h3>
              <p className="feature-desc">
                Unlike other apps, our engine weights your dismissals as heavily as
                your ratings — getting smarter from both sides of your taste.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="15" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                  <circle cx="12" cy="8" r="3" fill="currentColor" opacity="0.4"/>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                  <path d="M14 14h7v7h-7z" rx="1.5" fill="currentColor" opacity="0.4"/>
                  <path d="M17.5 17.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Letterboxd sync</h3>
              <p className="feature-desc">
                Connect your Letterboxd account to automatically import your watch
                history and ratings — personalized from day one.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="7" width="5" height="10" rx="1" fill="currentColor" opacity="0.35"/>
                  <rect x="13" y="4" width="5" height="13" rx="1" fill="currentColor" opacity="0.6"/>
                  <rect x="8.5" y="9" width="5" height="8" rx="1" fill="currentColor" opacity="0.85"/>
                </svg>
              </div>
              <h3 className="feature-title">Franchise collections</h3>
              <p className="feature-desc">
                Browse complete franchises like MCU, Star Wars, Harry Potter, and more.
                Track what you've seen and discover what's next in order.
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                  <path d="M12 7v5l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Free forever</h3>
              <p className="feature-desc">
                No subscriptions, no ads, no tracking. Just personalized recommendations
                that get smarter every day at zero cost.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-glow" />
        <div className="cta-inner">
          <h2 className="cta-title">Find movies you'll actually love.</h2>
          <p className="cta-subtitle">
            Join thousands of movie fans who stopped wasting time and started watching.
          </p>
          <AppStoreBadge />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="Slate AI" className="footer-logo" />
            <span>Slate</span>
          </div>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <a href="mailto:slateai09@gmail.com">Contact</a>
          </div>
          <p className="footer-copyright">© 2026 Slate. All rights reserved.</p>
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
          <Route
            path="/app/*"
            element={
              <AuthProvider>
                <ToastProvider>
                <div className="slate-app">
                <Routes>
                  <Route path="sign-in" element={<SignInPage />} />
                  <Route path="sign-up" element={<SignUpPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="choose-username" element={<ChooseUsernamePage />} />
                  <Route path="onboarding" element={<OnboardingPage />} />
                  <Route path="recommendations" element={<RecommendationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route
                    path="*"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/app/recommendations" replace />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                </div>
                </ToastProvider>
              </AuthProvider>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
