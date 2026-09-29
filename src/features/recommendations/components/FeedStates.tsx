import { Button } from "../../../core/components/Button";

export function FeedSkeleton({ label = "Finding movies picked for you…" }: { label?: string }) {
  return (
    <div className="feed__layout" aria-busy="true" aria-live="polite">
      <div>
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--short" />
        <p className="sr-only">{label}</p>
      </div>
      <div className="skeleton skeleton--panel" />
    </div>
  );
}

export function FeedDone({ onReload }: { onReload: () => void }) {
  return (
    <div className="feed__done">
      <span className="feed__done-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
        </svg>
      </span>
      <h1>You've seen them all!</h1>
      <p>We'll find more movies tailored to you.</p>
      <Button onClick={onReload}>Load more</Button>
    </div>
  );
}
