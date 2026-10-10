// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FriendEntry, FriendRequest, UserSearchResult } from "../../../core/models/Friends";

let friends: FriendEntry[] = [];
let incoming: FriendRequest[] = [];
const searchUsersByUsername = vi.fn();
const loadOutgoingPendingIds = vi.fn();
const sendFriendRequest = vi.fn();
const respondToRequest = vi.fn();
const toast = vi.fn();

vi.mock("../../../core/services/friends", () => ({
  subscribeFriends: (_uid: string, onData: (f: FriendEntry[]) => void) => { onData(friends); return () => undefined; },
  subscribeIncomingRequests: (_uid: string, onData: (r: FriendRequest[]) => void) => { onData(incoming); return () => undefined; },
  searchUsersByUsername: (...a: unknown[]) => searchUsersByUsername(...a),
  loadOutgoingPendingIds: (...a: unknown[]) => loadOutgoingPendingIds(...a),
  sendFriendRequest: (...a: unknown[]) => sendFriendRequest(...a),
  respondToRequest: (...a: unknown[]) => respondToRequest(...a),
  removeFriend: vi.fn(),
}));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "me", displayName: "Me" }, profile: { preferences: { username: "me_user", name: "Me Myself", avatarURL: "" } } }),
}));

import { FriendsPage } from "./FriendsPage";

const friend = (uid: string, name: string): FriendEntry => ({ uid, username: `${uid}_u`, displayName: name, avatarURL: "", topGenres: ["Drama", "Crime"], since: new Date(2026, 0, 1) });
const request = (id: string, from: string): FriendRequest => ({ id, fromUID: from, toUID: "me", fromUsername: `${from}_u`, fromDisplayName: `Person ${from}`, fromAvatarURL: "", status: "pending", createdAt: new Date() });
const hit = (uid: string): UserSearchResult => ({ uid, username: `${uid}_u`, displayName: `Hit ${uid}`, avatarURL: "", moviesRated: 12 });
const renderPage = () => render(<MemoryRouter><FriendsPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  friends = [];
  incoming = [];
  loadOutgoingPendingIds.mockResolvedValue(new Set());
  searchUsersByUsername.mockResolvedValue([]);
  sendFriendRequest.mockResolvedValue("sent");
  respondToRequest.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("FriendsPage", () => {
  it("lists friends with their top genres, each linking to their profile", () => {
    friends = [friend("a", "Ada Lovelace")];
    renderPage();
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("Drama · Crime")).toBeTruthy();
    expect(screen.getByText("Ada Lovelace").closest("a")?.getAttribute("href")).toBe("/app/friends/a");
  });

  it("shows an empty state that leads to adding a friend", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add a friend" }));
    expect(screen.getByLabelText("Search by username")).toBeTruthy();
  });

  it("badges the requests tab and accepts or declines", async () => {
    incoming = [request("r1", "x"), request("r2", "y")];
    renderPage();
    const tab = screen.getByRole("tab", { name: /Requests/ });
    expect(tab.textContent).toContain("2");
    fireEvent.click(tab);

    fireEvent.click(screen.getAllByRole("button", { name: "Accept" })[0]);
    await waitFor(() => expect(respondToRequest).toHaveBeenCalledWith("r1", "accepted"));
    expect(toast).toHaveBeenCalledWith("success", expect.stringContaining("Person x"));

    fireEvent.click(screen.getAllByRole("button", { name: "Decline" })[1]);
    await waitFor(() => expect(respondToRequest).toHaveBeenCalledWith("r2", "rejected"));
  });

  it("finds people, hides yourself, friends and pending requests, and sends a request", async () => {
    friends = [friend("f", "Already Friend")];
    incoming = [request("r1", "p")];
    searchUsersByUsername.mockResolvedValue([hit("me"), hit("f"), hit("p"), hit("new")]);
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Add friend" }));
    fireEvent.change(screen.getByLabelText("Search by username"), { target: { value: "hi" } });

    expect(await screen.findByText("Hit new")).toBeTruthy();
    expect(screen.queryByText("Hit me")).toBeNull();
    expect(screen.queryByText("Hit f")).toBeNull();
    expect(screen.queryByText("Hit p")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(sendFriendRequest).toHaveBeenCalledTimes(1));
    expect(sendFriendRequest).toHaveBeenCalledWith({ uid: "me", username: "me_user", displayName: "Me Myself", avatarURL: "" }, "new");
    await waitFor(() => expect(screen.queryByText("Hit new")).toBeNull());
  });

  it("does not search for fewer than two letters", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Add friend" }));
    fireEvent.change(screen.getByLabelText("Search by username"), { target: { value: "h" } });
    await new Promise((r) => setTimeout(r, 400));
    expect(searchUsersByUsername).not.toHaveBeenCalled();
  });
});
