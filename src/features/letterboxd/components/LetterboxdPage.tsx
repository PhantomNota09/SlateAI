import { AppShell } from "../../../core/components/AppShell";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { ImportPanel } from "./ImportPanel";
import "./Letterboxd.css";

export { LETTERBOXD_EXPORT_URL, importDate } from "./ImportPanel";

export function LetterboxdPage() {
  return (
    <ProtectedRoute>
      <Letterboxd />
    </ProtectedRoute>
  );
}

function Letterboxd() {
  usePageTitle("Import from Letterboxd");
  return (
    <AppShell>
      <main className="lbx">
        <header className="lbx__head">
          <h1>Import from Letterboxd</h1>
          <p>Bring your ratings and watch history so Slate never suggests a movie you've already seen.</p>
        </header>
        <ImportPanel />
      </main>
      <TmdbAttribution />
    </AppShell>
  );
}
