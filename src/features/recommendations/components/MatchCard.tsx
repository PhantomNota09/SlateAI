import { useState } from "react";
import type { MatchInfo } from "../../../core/models/Movie";

// Same tiers as iOS MatchPercentageCard. Only rendered when the function supplies match info.
function labelFor(pct: number): string {
  if (pct >= 90) return "Perfect match";
  if (pct >= 80) return "Great match";
  if (pct >= 70) return "Good match";
  if (pct >= 60) return "Decent match";
  return "Worth checking";
}

export function MatchCard({ info }: { info: MatchInfo }) {
  const [open, setOpen] = useState(false);
  const pct = Math.max(0, Math.min(100, Math.round(info.matchPercentage)));
  const strong = pct >= 75;

  return (
    <section className={["match", strong && "match--strong"].filter(Boolean).join(" ")} aria-label="Match">
      <div className="match__head">
        <span className="match__ring" style={{ ["--pct" as string]: `${pct}%` }} aria-hidden="true">
          <span>{pct}</span>
          <small>%</small>
        </span>
        <div className="match__text">
          <strong>{labelFor(pct)}</strong>
          <span>Based on your taste{info.reasons.length > 0 && ` · ${info.reasons.length} reasons`}</span>
        </div>
        {info.reasons.length > 0 && (
          <button type="button" className="match__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Hide" : "Why?"}
          </button>
        )}
      </div>
      {open && (
        <ul className="match__reasons">
          {info.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
