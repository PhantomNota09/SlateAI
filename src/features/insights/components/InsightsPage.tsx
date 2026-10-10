import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { StatPill } from "../../../core/components/StatPill";
import { Spinner } from "../../../core/components/Spinner";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { MIN_FILMS, type Summary, type TasteBreakdown } from "../insightsLogic";
import { SAMPLE_SIZE, useInsights, type AiState } from "../hooks/useInsights";
import "./Insights.css";

export function InsightsPage() {
  return (
    <ProtectedRoute>
      <Insights />
    </ProtectedRoute>
  );
}

function Insights() {
  usePageTitle("Insights");
  const { user } = useAuth();
  const { phase, films, stats, summary, enough, taste, tasteLoading, ai, generate, reload } = useInsights(user!.uid);

  if (phase === "loading") {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }
  if (phase === "error") {
    return (
      <AppShell>
        <ErrorState title="Couldn't load your insights" message="Check your connection and try again." onRetry={() => void reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="ins">
        <header className="ins__head">
          <h1>Insights</h1>
          <p>What your ratings say about your taste.</p>
        </header>

        {!enough ? (
          <section className="ins__card ins__empty">
            <h2>Rate {MIN_FILMS - films.length} more {MIN_FILMS - films.length === 1 ? "film" : "films"} to unlock insights</h2>
            <p>
              Insights need at least {MIN_FILMS} rated films. Rate movies from your feed, or bring your history over from Letterboxd.
            </p>
            <div className="ins__links">
              <Link to="/app/recommendations"><Button>Find something to rate</Button></Link>
              <Link to="/app/letterboxd"><Button variant="ghost">Import from Letterboxd</Button></Link>
            </div>
          </section>
        ) : (
          <>
            <Overview summary={summary} streak={stats?.currentStreak ?? 0} />
            <Ratings summary={summary} />
            <Activity summary={summary} />
            <Taste taste={taste} loading={tasteLoading} />
            <AiCard ai={ai} ready={!tasteLoading} onGenerate={(force) => void generate(force)} />
          </>
        )}
      </main>
      <TmdbAttribution />
    </AppShell>
  );
}

function Overview({ summary, streak }: { summary: Summary; streak: number }) {
  return (
    <section className="ins__stats" aria-label="Overview">
      <StatPill value={summary.total.toLocaleString()} label="Films logged" />
      <StatPill value={summary.rated > 0 ? summary.average.toFixed(1) : "–"} label="Average rating" />
      <StatPill value={summary.perWeek >= 10 ? Math.round(summary.perWeek) : summary.perWeek.toFixed(1)} label="Films per week" />
      <StatPill value={streak} label="Day streak" />
    </section>
  );
}

function Bars({ items, label }: { items: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="ins__bars" role="img" aria-label={label}>
      {items.map((i) => (
        <div key={i.label} className="ins__bar">
          <span className="ins__bar-count">{i.value > 0 ? i.value : ""}</span>
          <span className="ins__bar-fill" style={{ height: `${(i.value / max) * 100}%` }} />
          <span className="ins__bar-label">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

function Ratings({ summary }: { summary: Summary }) {
  if (summary.rated === 0) return null;
  return (
    <section className="ins__card" aria-labelledby="ins-ratings">
      <h2 id="ins-ratings">How you rate</h2>
      <Bars label="Number of films at each rating" items={summary.distribution.map((d) => ({ label: `${d.rating}★`, value: d.count }))} />
    </section>
  );
}

function Activity({ summary }: { summary: Summary }) {
  return (
    <section className="ins__card" aria-labelledby="ins-activity">
      <h2 id="ins-activity">Your activity</h2>
      <Bars label="Films logged in each of the last 12 months" items={summary.monthly.map((m) => ({ label: m.label, value: m.count }))} />
      {summary.busiestMonth && <p className="ins__note">Your busiest month of the year is {summary.busiestMonth}.</p>}
    </section>
  );
}

function Taste({ taste, loading }: { taste: TasteBreakdown; loading: boolean }) {
  return (
    <section className="ins__card" aria-labelledby="ins-taste">
      <h2 id="ins-taste">Your taste</h2>
      {taste.sampled === 0 ? (
        loading ? (
          <div className="ins__loading"><Spinner /><span>Looking up your films…</span></div>
        ) : (
          <p className="ins__note">We couldn't look up your films right now. Try again in a moment.</p>
        )
      ) : (
        <>
          <ul className="ins__genres">
            {taste.topGenres.map((g) => (
              <li key={g.name}>
                <span>{g.name}</span>
                <span className="ins__meter"><span style={{ width: `${g.percent}%` }} /></span>
                <span>{g.percent}%</span>
              </li>
            ))}
          </ul>
          <dl className="ins__facts">
            {taste.favoriteDecade && <div><dt>Favorite decade</dt><dd>{taste.favoriteDecade}</dd></div>}
            <div><dt>Non-English films</dt><dd>{taste.foreignPercent}%</dd></div>
            {taste.averageRuntime > 0 && <div><dt>Average runtime</dt><dd>{taste.averageRuntime} min</dd></div>}
            <div><dt>Genre variety</dt><dd>{taste.variety}/100</dd></div>
            <div><dt>Hidden gems</dt><dd>{taste.hiddenGems}</dd></div>
          </dl>
          <p className="ins__note">
            Based on your {taste.sampled} most recent films{loading ? ` (${taste.sampled} of up to ${SAMPLE_SIZE} so far…)` : ""}. Hidden gems are films you
            rated 4★ or more that score under 7.0 on TMDB.
          </p>
        </>
      )}
    </section>
  );
}

function AiCard({ ai, ready, onGenerate }: { ai: AiState; ready: boolean; onGenerate: (forceRefresh: boolean) => void }) {
  return (
    <section className="ins__card ins__ai" aria-labelledby="ins-ai">
      <h2 id="ins-ai">AI insights</h2>
      {ai.phase === "idle" && (
        <>
          <p className="ins__note">A short read on your taste and what to watch next, written by AI from your stats. No movie titles are shared.</p>
          <div className="ins__links">
            <Button onClick={() => onGenerate(false)} disabled={!ready}>{ready ? "Generate insights" : "Preparing your stats…"}</Button>
          </div>
        </>
      )}
      {ai.phase === "loading" && <div className="ins__loading"><Spinner /><span>Reading your taste…</span></div>}
      {ai.phase === "error" && (
        <>
          <Alert>{ai.message}</Alert>
          <div className="ins__links"><Button variant="ghost" onClick={() => onGenerate(false)}>Try again</Button></div>
        </>
      )}
      {ai.phase === "ready" && (
        <>
          {ai.data.personalityInsights.length > 0 && (
            <ul className="ins__tags" aria-label="Your film personality">
              {ai.data.personalityInsights.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          {ai.data.tasteProfile && <p className="ins__profile">{ai.data.tasteProfile}</p>}
          {ai.data.recommendedNextSteps.length > 0 && (
            <>
              <h3>Next steps</h3>
              <ul className="ins__steps">{ai.data.recommendedNextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
            </>
          )}
          <p className="ins__note">Refreshed at most once a week. Rate more films, then regenerate for a fresh take.</p>
          <div className="ins__links"><Button variant="ghost" onClick={() => onGenerate(true)}>Regenerate</Button></div>
        </>
      )}
    </section>
  );
}
