import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../../core/components/AppShell";
import { Button } from "../../../core/components/Button";
import { ProfileAvatar } from "../../../core/components/ProfileAvatar";
import { Spinner } from "../../../core/components/Spinner";
import { TextField } from "../../../core/components/TextField";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import type { FriendEntry, FriendRequest, UserSearchResult } from "../../../core/models/Friends";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { useFriends, useSentRequests, type SentRequest } from "../hooks/useFriends";
import { Leaderboard } from "./Leaderboard";
import { useUserSearch } from "../hooks/useUserSearch";
import "./Friends.css";

type Tab = "friends" | "requests" | "add" | "leaderboard";

export function FriendsPage() {
  return (
    <ProtectedRoute>
      <Friends />
    </ProtectedRoute>
  );
}

function Friends() {
  usePageTitle("Friends");
  const { user, profile } = useAuth();
  const toast = useToast();
  const { friends, requests, loadingFriends, loadingRequests, error, accept, decline } = useFriends(user!.uid, toast);
  const sentRequests = useSentRequests(user!.uid, toast);
  const [tab, setTab] = useState<Tab>("friends");

  const prefs = profile.preferences;
  const me = {
    uid: user!.uid,
    username: prefs?.username ?? "",
    displayName: prefs?.name ?? user?.displayName ?? "",
    avatarURL: prefs?.avatarURL ?? "",
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "requests", label: "Requests", count: requests.length },
    { id: "add", label: "Add friend" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <AppShell>
      <main className="frd">
        <header className="frd__head">
          <h1>Friends</h1>
          <p>See what your friends are watching and how your tastes compare.</p>
        </header>

        <div className="frd__tabs" role="tablist" aria-label="Friends sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              id={`frd-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="frd-panel"
              className={tab === t.id ? "is-active" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {!!t.count && <span className={`frd__count${t.id === "requests" ? " is-alert" : ""}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        <section id="frd-panel" role="tabpanel" aria-labelledby={`frd-tab-${tab}`} className="frd__panel">
          {tab === "friends" && <FriendList friends={friends} loading={loadingFriends} error={error} onAdd={() => setTab("add")} />}
          {tab === "requests" && (
            <RequestList
              requests={requests}
              loading={loadingRequests}
              onAccept={(r) => void accept(r)}
              onDecline={(r) => void decline(r)}
              sent={sentRequests.sent}
              cancelling={sentRequests.cancelling}
              onCancel={(r) => void sentRequests.cancel(r)}
            />
          )}
          {tab === "leaderboard" && <Leaderboard uid={user!.uid} friendUids={friends.map((f) => f.uid)} />}
          {tab === "add" && <AddFriend me={me} friends={friends} requests={requests} toast={toast} />}
        </section>
      </main>
    </AppShell>
  );
}

function Person({ name, username, photo, seed, children }: { name: string; username: string; photo: string; seed: string; children?: React.ReactNode }) {
  return (
    <div className="frd__person">
      <ProfileAvatar name={name || username} seed={seed} photoUrl={photo || null} size={48} />
      <div className="frd__who">
        <strong>{name || username}</strong>
        <small>@{username}</small>
        {children}
      </div>
    </div>
  );
}

function FriendList({ friends, loading, error, onAdd }: { friends: FriendEntry[]; loading: boolean; error: string | null; onAdd: () => void }) {
  if (loading) return <div className="frd__center"><Spinner /></div>;
  if (error) return <p className="frd__empty">{error}</p>;
  if (friends.length === 0) {
    return (
      <div className="frd__empty">
        <p>No friends yet.</p>
        <small>Add friends by username and compare your taste.</small>
        <Button onClick={onAdd}>Add a friend</Button>
      </div>
    );
  }
  return (
    <ul className="frd__list">
      {friends.map((f) => (
        <li key={f.uid}>
          <Link to={`/app/friends/${f.uid}`} className="frd__row">
            <Person name={f.displayName} username={f.username} photo={f.avatarURL} seed={f.uid}>
              {f.topGenres.length > 0 && <span className="frd__genres">{f.topGenres.slice(0, 3).join(" · ")}</span>}
            </Person>
            <span className="frd__chevron" aria-hidden="true">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface RequestListProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (r: FriendRequest) => void;
  onDecline: (r: FriendRequest) => void;
  sent: SentRequest[];
  cancelling: string | null;
  onCancel: (r: SentRequest) => void;
}

function RequestList({ requests, loading, onAccept, onDecline, sent, cancelling, onCancel }: RequestListProps) {
  if (loading) return <div className="frd__center"><Spinner /></div>;
  if (requests.length === 0 && sent.length === 0) return <p className="frd__empty">No pending requests.</p>;
  return (
    <>
      {requests.length > 0 && (
        <ul className="frd__list">
          {requests.map((r) => (
            <li key={r.id} className="frd__row frd__row--static">
              <Person name={r.fromDisplayName} username={r.fromUsername} photo={r.fromAvatarURL} seed={r.fromUID} />
              <div className="frd__actions">
                <Button variant="ghost" onClick={() => onDecline(r)}>Decline</Button>
                <Button onClick={() => onAccept(r)}>Accept</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sent.length > 0 && (
        <>
          <h2 className="frd__subhead">Sent</h2>
          <ul className="frd__list">
            {sent.map((r) => (
              <li key={r.id} className="frd__row frd__row--static">
                <Person name={r.displayName} username={r.username} photo={r.avatarURL} seed={r.toUID}>
                  <span className="frd__genres">Waiting for a reply</span>
                </Person>
                <Button variant="ghost" onClick={() => onCancel(r)} loading={cancelling === r.id} disabled={cancelling !== null} aria-label={`Cancel request to ${r.displayName || r.username}`}>
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function AddFriend({ me, friends, requests, toast }: { me: { uid: string; username: string; displayName: string; avatarURL: string }; friends: FriendEntry[]; requests: FriendRequest[]; toast: (k: "success" | "error", m: string) => void }) {
  const search = useUserSearch(me, new Set(friends.map((f) => f.uid)), new Set(requests.map((r) => r.fromUID)), toast);
  return (
    <div className="frd__add">
      <TextField
        label="Search by username"
        placeholder="Type at least 2 letters"
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />
      {search.searching && <div className="frd__center"><Spinner /></div>}
      {search.failed && <p className="frd__empty">Search failed. Please try again.</p>}
      {!search.searching && !search.failed && search.hasQuery && search.results.length === 0 && (
        <p className="frd__empty">No one found. Check the spelling, or they may already be a friend or have a pending request.</p>
      )}
      <ul className="frd__list">
        {search.results.map((r: UserSearchResult) => (
          <li key={r.uid} className="frd__row frd__row--static">
            <Person name={r.displayName} username={r.username} photo={r.avatarURL} seed={r.uid}>
              <span className="frd__genres">{r.moviesRated.toLocaleString()} {r.moviesRated === 1 ? "film" : "films"} rated</span>
            </Person>
            <Button onClick={() => void search.send(r)} loading={search.sending === r.uid} disabled={search.sending !== null}>
              Add
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
