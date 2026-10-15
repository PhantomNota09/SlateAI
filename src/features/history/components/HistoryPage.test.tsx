// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadUserCollections = vi.fn();
const loadLetterboxdMovies = vi.fn();
const removeDismissed = vi.fn();
const updateWatchedRating = vi.fn();
const removeWatched = vi.fn();
const toast = vi.fn();

vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  removeDismissed: (...a: unknown[]) => removeDismissed(...a),
  updateWatchedRating: (...a: unknown[]) => updateWatchedRating(...a),
  removeWatched: (...a: unknown[]) => removeWatched(...a),
})
);
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../../core/services/letterboxd", () => ({ loadLetterboxdMovies: (...a: unknown[]) => loadLetterboxdMovies(...a) }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/TmdbAttribution", () => ({ TmdbAttribution: () => null }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));

import { HistoryPage } from "./HistoryPage";

const watched = (id: number, rating: number, day: number) => ({ movieId: id, title: `Slate ${id}`, posterPath: null, rating, watchedAt: new Date(2026, 2, day) });
const imported = (id: number, rating: number) => ({ movieId: id, title: `Box ${id}`, posterPath: null, letterboxdRating: rating, watchedDate: new Date(2024, 0, id), importedAt: new Date(2026, 0, 1) });
const dismissed = { movieId: 50, title: "Nope Movie", posterPath: null, reason: "Looks boring", customReason: null, dismissedAt: new Date(2026, 1, 1) };
const renderPage = () => render(<MemoryRouter><HistoryPage /></MemoryRouter>);

beforeEach(() => {
  // jsdom has no <dialog> modal support
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.clearAllMocks();
  loadUserCollections.mockResolvedValue({ watched: [watched(1, 4.5, 5), watched(2, 3, 4)], dismissed: [dismissed] });
  loadLetterboxdMovies.mockResolvedValue([imported(2, 5), imported(3, 4)]);
  removeDismissed.mockResolvedValue(undefined);
  updateWatchedRating.mockResolvedValue(undefined);
  removeWatched.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("HistoryPage", () => {
  it("shows Slate and Letterboxd films merged, with counts on each filter", async () => {
    renderPage();
    expect(await screen.findByText("Slate 1")).toBeTruthy();
    expect(screen.getByText("Box 3")).toBeTruthy();
    expect(screen.getAllByText("Slate + Letterboxd")).toHaveLength(1); // film 2 appears once, in both
    expect(screen.getByRole("tab", { name: /All/ }).textContent).toContain("3");
    expect(screen.getByRole("tab", { name: /Not interested/ }).textContent).toContain("1");
  });

  it("filters to Letterboxd and to dismissed films", async () => {
    renderPage();
    await screen.findByText("Slate 1");

    fireEvent.click(screen.getByRole("tab", { name: /Letterboxd/ }));
    expect(screen.queryByText("Slate 1")).toBeNull();
    expect(screen.getByText("Box 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Not interested/ }));
    expect(screen.getByText("Nope Movie")).toBeTruthy();
    expect(screen.getByText("Looks boring")).toBeTruthy();
  });

  it("undoes a Not interested pick", async () => {
    renderPage();
    await screen.findByText("Slate 1");
    fireEvent.click(screen.getByRole("tab", { name: /Not interested/ }));
    fireEvent.click(screen.getByRole("button", { name: "Undo Not interested for Nope Movie" }));
    await waitFor(() => expect(removeDismissed).toHaveBeenCalledWith("u1", 50));
    await waitFor(() => expect(screen.queryByText("Nope Movie")).toBeNull());
    expect(toast).toHaveBeenCalledWith("success", expect.stringContaining("Nope Movie"));
  });

  it("keeps the pick and says so when the undo fails", async () => {
    removeDismissed.mockRejectedValue(new Error("offline"));
    renderPage();
    await screen.findByText("Slate 1");
    fireEvent.click(screen.getByRole("tab", { name: /Not interested/ }));
    fireEvent.click(screen.getByRole("button", { name: /Undo Not interested/ }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("error", expect.any(String)));
    expect(screen.getByText("Nope Movie")).toBeTruthy();
  });

  it("edits a Slate rating in place, starting from the current one", async () => {
    renderPage();
    await screen.findByText("Slate 1");
    fireEvent.click(screen.getByRole("button", { name: "Edit your rating for Slate 1" }));
    expect(screen.getByText("Rate 4.5/5.0")).toBeTruthy(); // opens on the existing rating
    fireEvent.click(screen.getByRole("button", { name: "Rate 4.5/5.0" }));
    await waitFor(() => expect(updateWatchedRating).toHaveBeenCalledWith("u1", 1, 4.5));
    expect(toast).toHaveBeenCalledWith("success", "Rating updated.");
  });

  it("removes a film from history after confirming, and offers nothing for Letterboxd-only films", async () => {
    renderPage();
    await screen.findByText("Slate 1");
    expect(screen.queryByRole("button", { name: /Remove Box 3/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Slate 1 from your history" }));
    expect(removeWatched).not.toHaveBeenCalled(); // asks first
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(removeWatched).toHaveBeenCalledWith("u1", 1));
    await waitFor(() => expect(screen.queryByText("Slate 1")).toBeNull());
  });

  it("puts a film back when removing it fails", async () => {
    removeWatched.mockRejectedValue(new Error("offline"));
    renderPage();
    await screen.findByText("Slate 1");
    fireEvent.click(screen.getByRole("button", { name: "Remove Slate 1 from your history" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("error", expect.any(String)));
    expect(screen.getByText("Slate 1")).toBeTruthy();
  });

  it("pages through a long history", async () => {
    loadUserCollections.mockResolvedValue({ watched: Array.from({ length: 70 }, (_, i) => watched(i + 1, 4, 1)), dismissed: [] });
    loadLetterboxdMovies.mockResolvedValue([]);
    renderPage();
    await screen.findByText(/Show more \(10 left\)/);
    expect(document.querySelectorAll(".hist__card")).toHaveLength(60);
    fireEvent.click(screen.getByRole("button", { name: /Show more/ }));
    expect(document.querySelectorAll(".hist__card")).toHaveLength(70);
  });

  it("explains an empty history and points to ways to fill it", async () => {
    loadUserCollections.mockResolvedValue({ watched: [], dismissed: [] });
    loadLetterboxdMovies.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("No history yet")).toBeTruthy();
    expect(screen.getByText("Import from Letterboxd")).toBeTruthy();
  });

  it("still shows Slate history when the Letterboxd list fails to load", async () => {
    loadLetterboxdMovies.mockRejectedValue(new Error("denied"));
    renderPage();
    expect(await screen.findByText("Slate 1")).toBeTruthy();
  });
});
