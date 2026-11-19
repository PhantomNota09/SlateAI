import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { ConsentBanner } from './core/analytics/ConsentBanner';
import { reportLanding } from './core/analytics/landing';
import SharedProfile from './pages/SharedProfile';
import './App.css';

// The web app (auth, onboarding, recommendations, profile) is a separate chunk.
const AppSection = lazy(() => import('./AppSection'));

// One landing_view per page load, with ?src / ?from attribution (sent only after consent).
reportLanding(window.location.search);

function App() {
  return (
    <Router>
      <div className="App">
        <ConsentBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/u/:username" element={<SharedProfile />} />
          <Route
            path="/app/*"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0e1117' }} aria-busy="true" />}>
                <AppSection />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
