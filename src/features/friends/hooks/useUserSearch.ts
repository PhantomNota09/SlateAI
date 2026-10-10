import { useCallback, useEffect, useRef, useState } from "react";
import type { UserSearchResult } from "../../../core/models/Friends";
import { loadOutgoingPendingIds, searchUsersByUsername, sendFriendRequest } from "../../../core/services/friends";

type Toast = (kind: "success" | "error", message: string) => void;

export interface Me {
  uid: string;
  username: string;
  displayName: string;
  avatarURL: string;
}

// Find people by username (iOS AddFriendView). Results leave out you, your friends and anyone with
// a request already pending either way, and someone you just added disappears from the list.
export function useUserSearch(me: Me, friendIds: ReadonlySet<string>, incomingIds: ReadonlySet<string>, onToast: Toast) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const sentIds = useRef(new Set<string>());
  const [, bump] = useState(0);
  const toast = useRef(onToast);
  toast.current = onToast;
  const latest = useRef(0);

  // Debounced search; stale responses are ignored.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setFailed(false);
      return;
    }
    const run = ++latest.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [found, outgoing] = await Promise.all([searchUsersByUsername(q), loadOutgoingPendingIds(me.uid).catch(() => new Set<string>())]);
        if (run !== latest.current) return;
        outgoing.forEach((id) => sentIds.current.add(id));
        setResults(found);
        setFailed(false);
      } catch (err) {
        if (run !== latest.current) return;
        console.error("User search failed", err);
        setResults([]);
        setFailed(true);
      } finally {
        if (run === latest.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, me.uid]);

  const visible = results.filter((r) => r.uid !== me.uid && !friendIds.has(r.uid) && !incomingIds.has(r.uid) && !sentIds.current.has(r.uid));

  const send = useCallback(
    async (target: UserSearchResult) => {
      setSending(target.uid);
      try {
        const outcome = await sendFriendRequest(me, target.uid);
        sentIds.current.add(target.uid);
        bump((n) => n + 1);
        toast.current("success", outcome === "sent" ? `Friend request sent to ${target.displayName || target.username}!` : `Request already sent to ${target.displayName || target.username}.`);
      } catch (err) {
        console.error("Sending friend request failed", err);
        toast.current("error", "Couldn't send that request. Please try again.");
      } finally {
        setSending(null);
      }
    },
    [me],
  );

  return { query, setQuery, results: visible, searching, failed, sending, send, hasQuery: query.trim().length >= 2 };
}
