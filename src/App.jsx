import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';

// The web app (auth, onboarding, recommendations, profile) is a separate chunk.
const AppSection = lazy(() => import('./AppSection'));

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
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
