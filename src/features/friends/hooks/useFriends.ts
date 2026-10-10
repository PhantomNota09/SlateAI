import { useCallback, useEffect, useRef, useState } from "react";
import type { FriendEntry, FriendRequest } from "../../../core/models/Friends";
import { removeFriend, respondToRequest, subscribeFriends, subscribeIncomingRequests } from "../../../core/services/friends";

type Toast = (kind: "success" | "error", message: string) => void;

// Live friends list and incoming requests (iOS FriendsViewModel listeners), plus the actions on them.
export function useFriends(uid: string, onToast: Toast) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useRef(onToast);
  toast.current = onToast;

  useEffect(() => {
    setLoadingFriends(true);
    setLoadingRequests(true);
    setError(null);
    const stopFriends = subscribeFriends(
      uid,
      (list) => { setFriends(list); setLoadingFriends(false); },
      (err) => { console.error("Friends listener failed", err); setError("We couldn't load your friends."); setLoadingFriends(false); },
    );
    const stopRequests = subscribeIncomingRequests(
      uid,
      (list) => { setRequests(list); setLoadingRequests(false); },
      (err) => { console.error("Requests listener failed", err); setLoadingRequests(false); },
    );
    return () => {
      stopFriends();
      stopRequests();
    };
  }, [uid]);

  const accept = useCallback(async (request: FriendRequest) => {
    try {
      await respondToRequest(request.id, "accepted");
      toast.current("success", `You and ${request.fromDisplayName || "your new friend"} are now friends!`);
    } catch (err) {
      console.error("Accepting request failed", err);
      toast.current("error", "Couldn't accept that request. Please try again.");
    }
  }, []);

  const decline = useCallback(async (request: FriendRequest) => {
    try {
      await respondToRequest(request.id, "rejected");
    } catch (err) {
      console.error("Declining request failed", err);
      toast.current("error", "Couldn't decline that request. Please try again.");
    }
  }, []);

  const remove = useCallback(
    async (friend: FriendEntry): Promise<boolean> => {
      try {
        await removeFriend(uid, friend.uid);
        toast.current("success", "Friend removed.");
        return true;
      } catch (err) {
        console.error("Removing friend failed", err);
        toast.current("error", "Couldn't remove that friend. Please try again.");
        return false;
      }
    },
    [uid],
  );

  return { friends, requests, loadingFriends, loadingRequests, error, accept, decline, remove };
}

// Just the number of waiting requests, for the nav badge.
export function useIncomingRequestCount(uid: string | undefined): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!uid) return;
    return subscribeIncomingRequests(uid, (list) => setCount(list.length), () => setCount(0));
  }, [uid]);
  return count;
}
