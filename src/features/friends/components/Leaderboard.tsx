import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../core/components/Button";
import { ProfileAvatar } from "../../../core/components/ProfileAvatar";
import { Spinner } from "../../../core/components/Spinner";
import type { LeaderboardEntry } from "../../../core/models/LeaderboardEntry";
import { useLeaderboard, type LeaderboardScope } from "../hooks/useLeaderboard";

// Top 10 by films rated (Slate + Letterboxd), globally or among your friends (iOS LeaderboardView).
export function Leaderboard({ uid, friendUids }: { uid: string; friendUids: string[] }) {
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const { result, loading, failed, reload } = useLeaderboard(uid, scope, friendUids);
  const friends = new Set(friendUids);

  return (
    <div className="lb">
      <div className="lb__scope" role="group" aria-label="Leaderboard scope">
        {(["global", "friends"] as const).map((s) => (
          <button key={s} type="button" className={scope === s ? "is-active" : undefined} aria-pressed={scope === s} onClick={() => setScope(s)}>
            {s === "global" ? "Global" : "Friends"}
          </button>
        ))}
      </div>

      {failed ? (
        <div className="frd__empty">
          <p>Couldn't load the leaderboard.</p>
          <Button onClick={() => void reload()}>Try again</Button>
        </div>
      ) : loading && !result ? (
        <div className="frd__center"><Spinner /></div>
      ) : scope === "friends" && friendUids.length === 0 ? (
        <div className="frd__empty">
          <p>No friends yet.</p>
          <small>Add friends to see how you compare.</small>
        </div>
      ) : !result || (result.entries.length === 0 && !result.me) ? (
        <p className="frd__empty">Nobody is on the leaderboard yet.</p>
      ) : (
        <>
          <ol className="lb__list">
            {result.entries.map((e) => <Row key={e.uid} entry={e} isFriend={friends.has(e.uid)} />)}
          </ol>
          {result.me && (
            <>
              <p className="lb__gap" aria-hidden="true">· · ·</p>
              <ol className="lb__list" start={result.me.rank || undefined}>
                <Row entry={result.me} isFriend={false} />
              </ol>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Row({ entry, isFriend }: { entry: LeaderboardEntry; isFriend: boolean }) {
  const podium = entry.rank >= 1 && entry.rank <= 3 ? ` lb__row--p${entry.rank}` : "";
  const body = (
    <>
      <span className="lb__rank" aria-label={entry.rank > 0 ? `Rank ${entry.rank}` : "Unranked"}>{entry.rank > 0 ? entry.rank : "—"}</span>
      <ProfileAvatar name={entry.displayName || entry.username} seed={entry.uid} photoUrl={entry.avatarURL || null} size={44} />
      <span className="lb__name">@{entry.username}{entry.isCurrentUser && " (you)"}</span>
      <span className="lb__score"><strong>{entry.score.toLocaleString()}</strong><small>{entry.score === 1 ? "film" : "films"}</small></span>
    </>
  );
  const cls = `lb__row${podium}${entry.isCurrentUser ? " is-me" : ""}`;
  return (
    <li>
      {isFriend && !entry.isCurrentUser ? <Link to={`/app/friends/${entry.uid}`} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}
    </li>
  );
}
