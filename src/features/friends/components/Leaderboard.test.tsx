// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadGlobal = vi.fn();
const loadFriends = vi.fn();
vi.mock("../../../core/services/leaderboard", () => ({
  loadGlobalLeaderboard: (...a: unknown[]) => loadGlobal(...a),
  loadFriendsLeaderboard: (...a: unknown[]) => loadFriends(...a),
}));

import { Leaderboard } from "./Leaderboard";

const entry = (uid: string, rank: number, score: number, me = false) => ({ rank, uid, username: `user_${uid}`, displayName: uid, avatarURL: "", score, topGenres: [], isCurrentUser: me });

beforeEach(() => {
  vi.clearAllMocks();
  loadGlobal.mockResolvedValue({ entries: [entry("a", 1, 50), entry("f1", 2, 30)], me: entry("me", 41, 2, true) });
  loadFriends.mockResolvedValue({ entries: [entry("f1", 1, 30), entry("me", 2, 2, true)], me: null });
});
afterEach(cleanup);

const renderBoard = (friends = ["f1"]) => render(<MemoryRouter><Leaderboard uid="me" friendUids={friends} /></MemoryRouter>);

describe("Leaderboard", () => {
  it("lists the top entries and pins your row below when you're outside them", async () => {
    renderBoard();
    expect(await screen.findByText("@user_a")).toBeTruthy();
    expect(screen.getByText("@user_me (you)")).toBeTruthy();
    expect(screen.getByLabelText("Rank 41")).toBeTruthy();
  });

  it("links friends to their profile, but not strangers or yourself", async () => {
    renderBoard();
    await screen.findByText("@user_a");
    expect(screen.getByRole("link", { name: /user_f1/ }).getAttribute("href")).toBe("/app/friends/f1");
    expect(screen.queryByRole("link", { name: /user_a/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /user_me/ })).toBeNull();
  });

  it("switches to friends only", async () => {
    renderBoard();
    await screen.findByText("@user_a");
    fireEvent.click(screen.getByRole("button", { name: "Friends" }));
    await waitFor(() => expect(loadFriends).toHaveBeenCalledWith("me", ["f1"]));
    await waitFor(() => expect(screen.queryByText("@user_a")).toBeNull());
  });

  it("says so when you have no friends, and offers a retry when loading fails", async () => {
    renderBoard([]);
    await screen.findByText("@user_a");
    fireEvent.click(screen.getByRole("button", { name: "Friends" }));
    expect(await screen.findByText("No friends yet.")).toBeTruthy();
    cleanup();

    loadGlobal.mockRejectedValueOnce(new Error("offline"));
    renderBoard();
    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("@user_a")).toBeTruthy();
  });
});
