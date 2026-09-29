import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../../core/components/AppShell";
import { ErrorState } from "../../../core/components/FullPageState";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { matchInfoOf, type MovieRef } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { useMovieDetail } from "../hooks/useMovieDetail";
import { useRecommendations } from "../hooks/useRecommendations";
import { ActionPanel } from "./ActionPanel";
import { DismissDialog, RatingDialog, TrailerDialog, WatchLaterDrawer } from "./Dialogs";
import { FeedDone, FeedSkeleton } from "./FeedStates";
import { MovieHero } from "./MovieHero";
import { MovieInfo } from "./MovieInfo";
import "./Recommendations.css";

export function RecommendationsPage() {
  return (
    <ProtectedRoute>
      <Feed />
    </ProtectedRoute>
  );
}

function Feed() {
  usePageTitle("For You");
  const { user, profile } = useAuth();
  const toast = useToast();
  const region = (profile.preferences?.region ?? "US").toUpperCase();
  const rec = useRecommendations(user!.uid, toast);
  const { current } = rec;
  const { detail, loading } = useMovieDetail(current?.id ?? null, region, rec.upNext[0]?.id ?? null);

  const [rating, setRating] = useState<MovieRef | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const firstName = (profile.preferences?.name ?? "").trim().split(/\s+/)[0];
  const greeting = firstName && firstName !== "User" ? `Hi, ${firstName}` : "For You";
  const anyDialogOpen = !!rating || dismissing || trailer || drawer;

  // Keyboard shortcuts for the current card; ignored while typing or when a dialog is open.
  const { skip, saveForLater } = rec;
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!current || anyDialogOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      switch (e.key.toLowerCase()) {
        case "r": setRating({ id: current.id, title: current.title, posterPath: current.posterPath }); break;
        case "w": void saveForLater(current); break;
        case "n": setDismissing(true); break;
        case "s": skip(current); break;
        default: return;
      }
      e.preventDefault();
    },
    [current, anyDialogOpen, skip, saveForLater],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  let body;
  if (rec.phase === "loading") {
    body = <FeedSkeleton />;
  } else if (rec.phase === "error") {
    body = (
      <ErrorState
        title="Unable to load"
        message={rec.error ?? "Something went wrong."}
        onRetry={() => void rec.reload()}
      />
    );
  } else if (current) {
    body = (
      <div className="feed__layout" key={current.id}>
        <article className="feed__main">
          <p className="feed__greeting">
            <strong>{greeting}</strong> · Picked for you
          </p>
          <MovieHero movie={current} detail={detail} onPlayTrailer={() => setTrailer(true)} />
          <MovieInfo movie={current} detail={detail} loading={loading} match={matchInfoOf(current)} />
        </article>
        <ActionPanel
          movie={current}
          upNext={rec.upNext}
          onWatched={() => setRating({ id: current.id, title: current.title, posterPath: current.posterPath })}
          onSave={() => void rec.saveForLater(current)}
          onDismiss={() => setDismissing(true)}
          onSkip={() => rec.skip(current)}
        />
      </div>
    );
  } else if (rec.refillFailed) {
    body = (
      <ErrorState
        title="Unable to load more"
        message={rec.refillError ?? "Something went wrong."}
        onRetry={() => void rec.reload()}
      />
    );
  } else if (rec.refilling || !rec.exhausted) {
    body = <FeedSkeleton label="Finding more movies…" />;
  } else {
    body = <FeedDone onReload={() => void rec.reload()} />;
  }

  return (
    <AppShell watchLaterCount={rec.watchLater.length} onOpenWatchLater={() => setDrawer(true)}>
      <main className="feed">{body}</main>

      <footer className="feed__footer">
        <img src="/tmdb-logo.svg" alt="TMDB" height="12" />
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </footer>

      <RatingDialog movie={rating} onClose={() => setRating(null)} onRate={(m, r) => void rec.markWatched(m, r)} />
      <DismissDialog
        open={dismissing}
        onClose={() => setDismissing(false)}
        onConfirm={(reason) => current && void rec.dismiss(current, reason)}
      />
      <TrailerDialog open={trailer} onClose={() => setTrailer(false)} title={current?.title ?? ""} videoKey={detail?.trailerKey ?? null} />
      <WatchLaterDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        items={rec.watchLater}
        onRemove={(id) => void rec.removeFromWatchLater(id)}
        onMarkWatched={(m) => setRating(m)}
      />
    </AppShell>
  );
}
