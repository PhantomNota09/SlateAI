import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { ProfileAvatar } from "../../../core/components/ProfileAvatar";
import { StatPill } from "../../../core/components/StatPill";
import { TmdbAttribution } from "../../../core/components/TmdbAttribution";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { GENRES } from "../../../core/models/genres";
import { posterUrl } from "../../../core/models/Movie";
import type { UserPreferences } from "../../../core/models/UserPreferences";
import type { UserStats } from "../../../core/models/UserStats";
import type { WatchedRecommendation } from "../../../core/models/WatchedRecommendation";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { useProfile } from "../hooks/useProfile";
import { BadgeGrid } from "./BadgeGrid";
import { ProfileTabs } from "./ProfileTabs";
import "./Profile.css";

export function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}

const genreName = (id: number) => GENRES.find((g) => g.id === id)?.name;

function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function Profile() {
  usePageTitle("Profile");
  const { user, profile } = useAuth();
  const { phase, stats, recent, reload } = useProfile(user!.uid);

  if (phase === "loading") {
    return (
      <AppShell>
        <ProfileTabs />
        <LoadingState />
      </AppShell>
    );
  }
  if (phase === "error") {
    return (
      <AppShell>
        <ProfileTabs />
        <ErrorState title="Couldn't load your profile" message="Check your connection and try again." onRetry={() => void reload()} />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <ProfileTabs />
      <ProfileView
        uid={user!.uid}
        authName={user?.displayName ?? ""}
        authPhoto={user?.photoURL ?? null}
        stats={stats}
        recent={recent}
        prefs={profile.preferences}
      />
      <TmdbAttribution />
    </AppShell>
  );
}

// Presentational: everything comes in as props, so it renders (and is easy to test) without Firebase.
export function ProfileView({
  uid,
  authName,
  authPhoto,
  stats,
  recent,
  prefs,
}: {
  uid: string;
  authName: string;
  authPhoto: string | null;
  stats: UserStats | null;
  recent: WatchedRecommendation[];
  prefs: Partial<UserPreferences> | null;
}) {
  const name = stats?.displayName || prefs?.name || authName || "Your profile";
  const username = prefs?.username || stats?.username || "";
  const joined = stats?.joinedAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(stats.joinedAt)
    : null;
  const s = stats;

  return (
    <main className="profile">
      <section className="card profile__hero">
        <ProfileAvatar name={name} seed={uid} photoUrl={prefs?.avatarURL || s?.avatarURL || authPhoto} size={80} />
        <div className="profile__id">
          <h1>{name}</h1>
          <p>
            {username && <span>@{username}</span>}
            {joined && <span>Joined {joined}</span>}
          </p>
        </div>
      </section>

      <Streak current={s?.currentStreak ?? 0} best={s?.longestStreak ?? 0} />

      <section className="profile-stats" aria-label="Your stats">
        <StatPill value={s?.totalMoviesRated ?? 0} label="Films rated" />
        <StatPill value={s?.moviesWatched ?? 0} label="Watched" />
        <StatPill value={s && s.avgRating > 0 ? s.avgRating.toFixed(1) : "—"} label="Average rating" />
        <StatPill value={s?.weeklyRated ?? 0} label="Rated this week" />
      </section>

      {(!s || s.totalMoviesRated === 0) && (
        <p className="profile__empty">Rate a few movies from For You and your stats and badges will start to fill in.</p>
      )}

      {s && s.topGenres.length > 0 && (
        <section className="card" aria-labelledby="genres-title">
          <header className="card__head">
            <h2 id="genres-title">Top genres</h2>
          </header>
          <ul className="chips-list">
            {s.topGenres.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      <BadgeGrid stats={s ?? EMPTY_STATS} />

      {prefs && <Taste prefs={prefs} />}

      {recent.length > 0 && (
        <section className="card" aria-labelledby="recent-title">
          <header className="card__head">
            <h2 id="recent-title">Recently watched</h2>
          </header>
          <ul className="recent">
            {recent.map((m) => (
              <li key={m.movieId}>
                {posterUrl(m.posterPath, "w342") ? (
                  <img src={posterUrl(m.posterPath, "w342")!} alt="" loading="lazy" />
                ) : (
                  <span className="recent__blank" />
                )}
                <strong>{m.title}</strong>
                {m.rating > 0 && <span className="recent__rating">★ {m.rating.toFixed(1)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Streak({ current, best }: { current: number; best: number }) {
  return (
    <section className="streak" aria-label="Streak">
      <span className={["streak__now", current > 0 && "is-live"].filter(Boolean).join(" ")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        {current > 0 ? (
          <>
            <strong>{current}</strong> day streak
          </>
        ) : (
          "Start your streak today"
        )}
      </span>
      {best > 0 && <span className="streak__best">Best: {best}</span>}
    </section>
  );
}

function streamingSummary(prefs: Partial<UserPreferences>): string {
  const n = (prefs.preferredStreamingServices ?? []).length;
  if (n === 0) return "All streaming services";
  return `${n} service${n === 1 ? "" : "s"} selected${prefs.region ? ` · ${prefs.region.toUpperCase()}` : ""}`;
}

function Taste({ prefs }: { prefs: Partial<UserPreferences> }) {
  const fav = (prefs.topGenres ?? []).map(genreName).filter(Boolean) as string[];
  const avoid = (prefs.avoidGenres ?? []).map(genreName).filter(Boolean) as string[];
  const langs = (prefs.preferredLanguages ?? []).map(languageName);
  const rows: [string, string][] = [
    ["Favorite genres", fav.join(", ")],
    ["Avoiding", avoid.join(", ")],
    ["Languages", langs.join(", ")],
    ["Streaming", streamingSummary(prefs)],
    ["Releases", prefs.releasePreference ?? ""],
    ["Runtime", prefs.runtimePreference ?? ""],
    ["Story", prefs.storyPreference ?? ""],
    ["Tone", prefs.tonePreference ?? ""],
  ];
  const shown = rows.filter(([, v]) => v);
  if (shown.length === 0) return null;
  return (
    <section className="card" aria-labelledby="taste-title">
      <header className="card__head">
        <h2 id="taste-title">Your taste</h2>
        <Link to="/app/preferences" className="card__meta card__link">Edit preferences</Link>
      </header>
      <dl className="taste">
        {shown.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const EMPTY_STATS: UserStats = {
  username: "", displayName: "", avatarURL: "", moviesWatched: 0, moviesRated: 0, letterboxdMoviesRated: 0,
  totalMoviesRated: 0, avgRating: 0, topGenres: [], weeklyRated: 0, totalPoints: 0, joinedAt: null,
  currentStreak: 0, longestStreak: 0, lastInteractionDate: null, earnedBadges: [], badgeEarnedDates: {},
};
