import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { useToast } from "../../../core/components/Toast";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { posterUrl } from "../../../core/models/Movie";
import type { DismissedRecommendation } from "../../../core/models/DismissedRecommendation";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { ProfileTabs } from "../../profile/components/ProfileTabs";
import { filterItems, formatStars, type HistoryFilter, type HistoryItem } from "../historyLogic";
import { useHistory } from "../hooks/useHistory";
import "../../profile/components/Profile.css";
import "./History.css";

const PAGE_SIZE = 60; // long Letterboxd libraries are shown a page at a time

export function HistoryPage() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  );
}

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "watched", label: "Watched" },
  { id: "letterboxd", label: "Letterboxd" },
  { id: "dismissed", label: "Not interested" },
];

const date = (d: Date) => (d.getTime() > 0 ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : "");

function History() {
  usePageTitle("History");
  const { user } = useAuth();
  const toast = useToast();
  const { phase, items, dismissed, counts, reload, undismiss } = useHistory(user!.uid);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  if (phase === "loading") return <AppShell><ProfileTabs /><LoadingState /></AppShell>;
  if (phase === "error") {
    return (
      <AppShell>
        <ProfileTabs />
        <ErrorState title="Couldn't load your history" message="Check your connection and try again." onRetry={() => void reload()} />
      </AppShell>
    );
  }

  const undo = async (d: DismissedRecommendation) => {
    if (await undismiss(d.movieId)) toast("success", `${d.title} can be recommended again.`);
    else toast("error", "Couldn't undo that. Please try again.");
  };

  const pick = (f: HistoryFilter) => {
    setFilter(f);
    setShown(PAGE_SIZE);
  };
  const rows: HistoryItem[] = filter === "dismissed" ? [] : filterItems(items, filter);
  const total = filter === "dismissed" ? dismissed.length : rows.length;
  const empty = counts.all === 0 && counts.dismissed === 0;

  return (
    <AppShell>
      <ProfileTabs />
      <main className="hist">
        {empty ? (
          <div className="hist__empty">
            <p>No history yet</p>
            <small>Rate movies from your feed, or bring your history over from Letterboxd.</small>
            <div className="hist__links">
              <Link to="/app/recommendations"><Button>Find something to watch</Button></Link>
              <Link to="/app/letterboxd"><Button variant="ghost">Import from Letterboxd</Button></Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hist__filters" role="tablist" aria-label="History filter">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? "is-active" : undefined} onClick={() => pick(f.id)}>
                  {f.label}
                  <span>{counts[f.id].toLocaleString()}</span>
                </button>
              ))}
            </div>

            {total === 0 ? (
              <p className="hist__none">Nothing here yet.</p>
            ) : filter === "dismissed" ? (
              <ul className="hist__grid">
                {dismissed.slice(0, shown).map((d) => <DismissedCard key={d.movieId} item={d} onUndo={() => void undo(d)} />)}
              </ul>
            ) : (
              <ul className="hist__grid">
                {rows.slice(0, shown).map((i) => <HistoryCard key={i.movieId} item={i} />)}
              </ul>
            )}

            {total > shown && (
              <div className="hist__more">
                <Button variant="ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                  Show more ({(total - shown).toLocaleString()} left)
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <TmdbAttribution />
    </AppShell>
  );
}

function Poster({ path, title }: { path: string | null; title: string }) {
  const src = posterUrl(path, "w342");
  return src ? <img src={src} alt={`${title} poster`} loading="lazy" /> : <span className="hist__blank" role="img" aria-label={`${title}, no poster`} />;
}

const SOURCE_LABEL = { slate: "Slate", letterboxd: "Letterboxd", both: "Slate + Letterboxd" } as const;

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <li className="hist__card">
      <Poster path={item.posterPath} title={item.title} />
      <strong title={item.title}>{item.title}</strong>
      <small className="hist__stars">
        {item.slateRating != null && <span aria-label={`You rated ${item.slateRating} stars`}>{formatStars(item.slateRating)}</span>}
        {item.letterboxdRating != null && (
          <span className="hist__lb" aria-label={`Letterboxd rating ${item.letterboxdRating} stars`}>{formatStars(item.letterboxdRating)}</span>
        )}
      </small>
      <small>{date(item.date)}</small>
      <span className={`hist__badge hist__badge--${item.source}`}>{SOURCE_LABEL[item.source]}</span>
    </li>
  );
}

function DismissedCard({ item, onUndo }: { item: DismissedRecommendation; onUndo: () => void }) {
  return (
    <li className="hist__card">
      <Poster path={item.posterPath} title={item.title} />
      <strong title={item.title}>{item.title}</strong>
      <small>{item.reason}</small>
      <small>{date(item.dismissedAt)}</small>
      <button type="button" className="hist__undo" onClick={onUndo} aria-label={`Undo Not interested for ${item.title}`}>Undo</button>
    </li>
  );
}
