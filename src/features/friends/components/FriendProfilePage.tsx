import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { Modal } from "../../../core/components/Modal";
import { ProfileAvatar } from "../../../core/components/ProfileAvatar";
import { StatPill } from "../../../core/components/StatPill";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { posterUrl } from "../../../core/models/Movie";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { useFriendProfile } from "../hooks/useFriendProfile";
import { useFriends } from "../hooks/useFriends";
import "./Friends.css";

export function FriendProfilePage() {
  return (
    <ProtectedRoute>
      <FriendProfile />
    </ProtectedRoute>
  );
}

function FriendProfile() {
  const { uid: friendUid = "" } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { friends, remove } = useFriends(user!.uid, toast);
  const { phase, stats, recent, match, reload } = useFriendProfile(user!.uid, friendUid);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const entry = friends.find((f) => f.uid === friendUid);
  usePageTitle(stats?.displayName || stats?.username || "Friend");

  if (phase === "loading") return <AppShell><LoadingState /></AppShell>;
  if (phase === "error" || !stats) {
    return (
      <AppShell>
        <ErrorState
          title="Couldn't load this profile"
          message="Check your connection and try again."
          onRetry={reload}
          action={<Link to="/app/friends"><Button variant="ghost">Back to friends</Button></Link>}
        />
      </AppShell>
    );
  }

  const name = stats.displayName || stats.username;
  return (
    <AppShell>
      <main className="frd frd--profile">
        <Link to="/app/friends" className="frd__back">‹ Friends</Link>

        <header className="frd__hero">
          <ProfileAvatar name={name} seed={friendUid} photoUrl={stats.avatarURL || null} size={80} />
          <div>
            <h1>{name}</h1>
            <p>@{stats.username}</p>
            {entry && entry.since.getTime() > 0 && <small>Friends since {entry.since.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</small>}
          </div>
        </header>

        <section className="frd__stats" aria-label="Stats">
          <StatPill value={stats.totalMoviesRated.toLocaleString()} label="Films rated" />
          <StatPill value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"} label="Average rating" />
          <StatPill value={stats.currentStreak} label="Day streak" />
        </section>

        {match && (
          <section className="frd__card frd__match" aria-labelledby="frd-match">
            <h2 id="frd-match">Taste match</h2>
            <div className="frd__score">
              <strong>{match.score}</strong>
              <span>{match.label}</span>
            </div>
            <ul>{match.insights.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        )}

        {stats.topGenres.length > 0 && (
          <section className="frd__card" aria-labelledby="frd-genres">
            <h2 id="frd-genres">Top genres</h2>
            <ul className="frd__chips">{stats.topGenres.map((g) => <li key={g}>{g}</li>)}</ul>
          </section>
        )}

        <section className="frd__card" aria-labelledby="frd-recent">
          <h2 id="frd-recent">Recently watched</h2>
          {recent.length === 0 ? (
            <p className="frd__note">Nothing rated on Slate yet.</p>
          ) : (
            <ul className="frd__posters">
              {recent.map((m) => (
                <li key={m.movieId}>
                  {posterUrl(m.posterPath, "w185") ? <img src={posterUrl(m.posterPath, "w185")!} alt={m.title} loading="lazy" /> : <span className="frd__blank" role="img" aria-label={m.title} />}
                  <small>{m.rating > 0 ? `★ ${m.rating}` : ""}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        {entry && (
          <div className="frd__danger">
            <Button variant="ghost" onClick={() => setConfirming(true)}>Remove friend</Button>
          </div>
        )}
      </main>
      <TmdbAttribution />

      <Modal open={confirming} onClose={() => !removing && setConfirming(false)} title={`Remove ${name}?`}>
        <p className="frd__note">You'll stop seeing each other's profiles in your friends lists. You can add them again any time.</p>
        <div className="frd__actions">
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={removing}>Cancel</Button>
          <Button
            loading={removing}
            onClick={async () => {
              setRemoving(true);
              const ok = entry ? await remove(entry) : false;
              setRemoving(false);
              if (ok) navigate("/app/friends");
              else setConfirming(false);
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
