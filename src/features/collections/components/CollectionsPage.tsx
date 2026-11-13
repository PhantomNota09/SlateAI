import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { ProgressBar } from "../../../core/components/ProgressBar";
import { TextField } from "../../../core/components/TextField";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { FRANCHISE_CATEGORIES, franchiseProgress, type Franchise } from "../../../core/models/Franchise";
import { backdropUrl, posterUrl } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useCollectionProgress } from "../hooks/useCollectionProgress";
import { useFranchises } from "../hooks/useFranchises";
import "./Collections.css";

export function CollectionsPage() {
  return (
    <ProtectedRoute>
      <Collections />
    </ProtectedRoute>
  );
}

function Collections() {
  usePageTitle("Collections");
  const { franchises, loading, failed, retry, refresh } = useFranchises();
  const { watched } = useCollectionProgress();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (franchises ?? []).filter(
      (f) => (category === "All" || f.categories.includes(category)) && (!q || f.displayName.toLowerCase().includes(q)),
    );
  }, [franchises, query, category]);

  if (!franchises) {
    return (
      <AppShell>
        {failed ? <ErrorState title="Couldn't load Collections" message="Check your connection and try again." onRetry={retry} /> : <LoadingState />}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="col">
        <header className="col__head">
          <h1>Collections</h1>
          <p>Track your progress across iconic franchises.</p>
        </header>

        <TextField
          label="Search franchises"
          placeholder="Search franchises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="col__chips" role="group" aria-label="Filter by category">
          {["All", ...FRANCHISE_CATEGORIES].map((c) => (
            <button key={c} type="button" className={c === category ? "is-active" : undefined} aria-pressed={c === category} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="col__note">{loading ? "Loading…" : "No franchises found. Try a different search."}</p>
        ) : (
          <ul className="col__grid">
            {shown.map((f) => (
              <li key={f.id}>
                <FranchiseCard franchise={f} watched={watched} />
              </li>
            ))}
          </ul>
        )}
        {franchises.length > 0 && !loading && <Button variant="ghost" onClick={refresh} className="col__refresh">Check for updates</Button>}
      </main>
    </AppShell>
  );
}

function FranchiseCard({ franchise, watched }: { franchise: Franchise; watched: ReadonlySet<number> }) {
  const p = franchiseProgress(franchise, watched);
  const art = backdropUrl(franchise.backdropPath, "w780") ?? posterUrl(franchise.posterPath, "w342");
  return (
    <Link to={`/app/collections/${franchise.id}`} className="col__card" aria-label={`${franchise.displayName}, ${p.watched} of ${p.total} watched`}>
      {art ? <img src={art} alt="" loading="lazy" /> : <span className="col__blank" aria-hidden="true" />}
      <div className="col__info">
        <strong>{franchise.displayName}</strong>
        <small>{p.total} {p.total === 1 ? "film" : "films"}</small>
        <ProgressBar value={p.watched} max={p.total} label={`${franchise.displayName} progress`} />
        <small>{p.watched}/{p.total} watched · {p.percent}%</small>
      </div>
    </Link>
  );
}
