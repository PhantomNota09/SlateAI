import { useRef, useState, type DragEvent } from "react";
import { AppShell } from "../../../core/components/AppShell";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { ProgressBar } from "../../../core/components/ProgressBar";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { estimateMinutes } from "../importRunner";
import { useLetterboxdImport, type Summary } from "../hooks/useLetterboxdImport";
import "./Letterboxd.css";

export const LETTERBOXD_EXPORT_URL = "https://letterboxd.com/settings/data/";

export function LetterboxdPage() {
  return (
    <ProtectedRoute>
      <Letterboxd />
    </ProtectedRoute>
  );
}

// Firestore Timestamps arrive as objects with toDate(); anything else is ignored.
export function importDate(value: unknown): Date | null {
  const d = (value as { toDate?: () => Date } | null | undefined)?.toDate?.();
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

function Letterboxd() {
  usePageTitle("Import from Letterboxd");
  const { user, profile, refreshProfile } = useAuth();
  const { state, choose, start, cancel, reset } = useLetterboxdImport(user!.uid, () => void refreshProfile().catch(() => undefined));

  const prefs = profile.preferences;
  const lastImport = importDate(prefs?.letterboxdFullImportDate);
  const total = Number(prefs?.letterboxdTotalMoviesImported ?? 0);

  return (
    <AppShell>
      <main className="lbx">
        <header className="lbx__head">
          <h1>Import from Letterboxd</h1>
          <p>Bring your ratings and watch history so Slate never suggests a movie you've already seen.</p>
        </header>

        {lastImport && total > 0 && state.step !== "importing" && (
          <section className="lbx__status" aria-label="Last import">
            <strong>{plural(total, "movie")} imported</strong>
            <span>Last import {lastImport.toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
          </section>
        )}

        {state.step === "idle" && <Picker error={state.error} onFile={(f) => void choose(f)} />}
        {state.step === "ready" && (
          <section className="lbx__card">
            <h2>Ready to import</h2>
            <p className="lbx__lead">
              <strong>{state.fileName}</strong> has {plural(state.entries.length, "film")}. Matching takes about{" "}
              {plural(estimateMinutes(state.entries.length), "minute")}, and you can leave this page open in another tab.
            </p>
            <div className="lbx__actions">
              <Button variant="ghost" onClick={reset}>Choose a different file</Button>
              <Button onClick={() => void start()}>Start import</Button>
            </div>
          </section>
        )}
        {state.step === "importing" && <Progress {...state} onCancel={cancel} />}
        {state.step === "done" && <Done summary={state.summary} onAgain={reset} />}
        {state.step === "failed" && (
          <section className="lbx__card">
            <Alert>{state.message}</Alert>
            <div className="lbx__actions">
              <Button onClick={reset}>Start over</Button>
            </div>
          </section>
        )}

        {(state.step === "idle" || state.step === "ready") && <Guide />}
      </main>
      <TmdbAttribution />
    </AppShell>
  );
}

function Guide() {
  return (
    <section className="lbx__card" aria-labelledby="lbx-how">
      <h2 id="lbx-how">How to export from Letterboxd</h2>
      <ol className="lbx__steps">
        <li>
          Open Letterboxd's{" "}
          <a href={LETTERBOXD_EXPORT_URL} target="_blank" rel="noopener noreferrer">export page ↗</a> and choose <em>Export Your Data</em>.
        </li>
        <li>Download the ZIP and unzip it on your computer.</li>
        <li>
          Choose <strong>ratings.csv</strong> from that folder below.
        </li>
      </ol>
      <p className="lbx__note">
        Your file is read in your browser and never uploaded. Slate saves each matched movie's title, poster, your rating and the date you
        watched it. Titles are looked up on TMDB through Slate's servers to find the right movie.
      </p>
    </section>
  );
}

function Picker({ error, onFile }: { error?: string; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  return (
    <section className="lbx__card">
      {error && <Alert>{error}</Alert>}
      <div
        className={`lbx__drop${over ? " is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        <strong>Drop ratings.csv here</strong>
        <span>or</span>
        <Button onClick={() => input.current?.click()}>Choose file</Button>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="Choose ratings.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
      </div>
    </section>
  );
}

function Progress({ current, total, cancelling, onCancel }: { current: number; total: number; cancelling: boolean; onCancel: () => void }) {
  const remaining = Math.max(0, total - current);
  return (
    <section className="lbx__card" aria-live="polite">
      <h2>{cancelling ? "Saving what we've matched…" : "Matching your films…"}</h2>
      <ProgressBar value={current} max={Math.max(1, total)} label="Import progress" />
      <p className="lbx__lead">
        {current.toLocaleString()} of {total.toLocaleString()}
        {!cancelling && remaining > 0 && ` · about ${plural(estimateMinutes(remaining), "minute")} left`}
      </p>
      <p className="lbx__note">Keep this tab open. Leaving the page stops matching but keeps everything matched so far.</p>
      <div className="lbx__actions">
        <Button variant="ghost" onClick={onCancel} disabled={cancelling}>Stop and save</Button>
      </div>
    </section>
  );
}

function Done({ summary, onAgain }: { summary: Summary; onAgain: () => void }) {
  const [showFailed, setShowFailed] = useState(false);
  return (
    <section className="lbx__card">
      <h2>{summary.cancelled ? "Import stopped" : "Import complete"}</h2>
      <dl className="lbx__results">
        <div><dt>Added</dt><dd>{summary.added.toLocaleString()}</dd></div>
        <div><dt>Already in Slate</dt><dd>{summary.skipped.toLocaleString()}</dd></div>
        <div><dt>Not matched</dt><dd>{summary.failed.length.toLocaleString()}</dd></div>
      </dl>
      {summary.cancelled && (
        <p className="lbx__note">
          Processed {summary.processed.toLocaleString()} of {summary.total.toLocaleString()}. Run the import again later to continue; films
          already added are skipped.
        </p>
      )}
      {summary.failed.length > 0 && (
        <>
          <button type="button" className="lbx__toggle" aria-expanded={showFailed} onClick={() => setShowFailed((v) => !v)}>
            {showFailed ? "Hide" : "Show"} films we couldn't match
          </button>
          {showFailed && (
            <ul className="lbx__failed">
              {summary.failed.map((f, i) => <li key={`${f}-${i}`}>{f}</li>)}
            </ul>
          )}
        </>
      )}
      <div className="lbx__actions">
        <Button variant="ghost" onClick={onAgain}>Import another file</Button>
      </div>
    </section>
  );
}
