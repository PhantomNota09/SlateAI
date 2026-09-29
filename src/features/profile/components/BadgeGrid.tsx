import { useState } from "react";
import { BadgeIcon } from "../../../core/components/BadgeIcon";
import { Modal } from "../../../core/components/Modal";
import { BADGES, badgeProgress, formatBadgeDate, type BadgeDefinition } from "../../../core/models/badges";
import type { UserStats } from "../../../core/models/UserStats";

export function BadgeGrid({ stats }: { stats: UserStats }) {
  const [selected, setSelected] = useState<BadgeDefinition | null>(null);
  const earnedCount = BADGES.filter((b) => stats.earnedBadges.includes(b.id)).length;

  return (
    <section className="card" aria-labelledby="badges-title">
      <header className="card__head">
        <h2 id="badges-title">Badges</h2>
        <span className="card__meta">
          {earnedCount}/{BADGES.length}
        </span>
      </header>

      <ul className="badges">
        {BADGES.map((b) => {
          const earned = stats.earnedBadges.includes(b.id);
          return (
            <li key={b.id}>
              <button
                type="button"
                className={["badge", earned && "is-earned"].filter(Boolean).join(" ")}
                onClick={() => setSelected(b)}
                aria-label={`${b.name}, ${earned ? "earned" : "locked"}`}
              >
                <span className="badge__icon">
                  <BadgeIcon icon={b.icon} />
                  {!earned && (
                    <span className="badge__lock" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" /></svg>
                    </span>
                  )}
                </span>
                <span className="badge__name">{b.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? "Badge"}>
        {selected && <BadgeDetail badge={selected} stats={stats} />}
      </Modal>
    </section>
  );
}

function BadgeDetail({ badge, stats }: { badge: BadgeDefinition; stats: UserStats }) {
  const p = badgeProgress(badge, stats);
  const date = formatBadgeDate(p.earnedDate);
  return (
    <div className="badge-detail">
      <span className={["badge-detail__icon", p.earned && "is-earned"].filter(Boolean).join(" ")}>
        <BadgeIcon icon={badge.icon} size={44} />
      </span>
      <p className="badge-detail__desc">{badge.description}</p>
      {p.earned ? (
        <p className="pill pill--good">{date ? `Earned ${date}` : "Earned"}</p>
      ) : p.current !== null && badge.threshold !== null ? (
        <p className="pill">
          <strong>
            {p.current} / {badge.threshold}
          </strong>{" "}
          {p.unit}
        </p>
      ) : (
        <p className="pill">Not earned yet</p>
      )}
    </div>
  );
}
