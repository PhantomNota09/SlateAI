import { Navigate, useNavigate } from "react-router-dom";
import { BrandMark } from "../../../core/components/BrandMark";
import { Button } from "../../../core/components/Button";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { useLetterboxdImport } from "../context/LetterboxdImportContext";
import { ImportPanel } from "./ImportPanel";
import "./Letterboxd.css";

// Shown once, right after onboarding: people who already track films on Letterboxd can bring
// their history across now. Optional, skippable, and the import keeps running afterwards.
export function WelcomePage() {
  return (
    <ProtectedRoute>
      <Welcome />
    </ProtectedRoute>
  );
}

function Welcome() {
  usePageTitle("Welcome to Slate");
  const { profile } = useAuth();
  const { state } = useLetterboxdImport();
  const navigate = useNavigate();

  const source = String(profile.preferences?.letterboxdImportSource ?? "none");
  const alreadyImported = source !== "none" && source !== "";
  // Anyone who has already imported has nothing to do here (until a run in progress finishes).
  if (alreadyImported && (state.step === "idle")) return <Navigate to="/app/recommendations" replace />;

  const started = state.step === "importing" || state.step === "done";
  return (
    <main className="lbx welcome">
      <BrandMark />
      <header className="lbx__head">
        <h1>You're all set. Do you use Letterboxd?</h1>
        <p>
          Bring your ratings and watch history across and Slate won't suggest a movie you've already seen. It's optional, and you can do it any
          time from your account menu.
        </p>
      </header>

      <ImportPanel />

      <div className="lbx__actions welcome__actions">
        {started ? (
          <Button onClick={() => navigate("/app/recommendations", { replace: true })}>Continue to For You</Button>
        ) : (
          <Button variant="ghost" onClick={() => navigate("/app/recommendations", { replace: true })}>Skip for now</Button>
        )}
      </div>
      <TmdbAttribution />
    </main>
  );
}
