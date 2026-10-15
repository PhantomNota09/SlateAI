// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const tmdbProxy = vi.fn();
const loadUserCollections = vi.fn();
const recordWatchLater = vi.fn();
const recordWatched = vi.fn();
const recordStreakInteraction = vi.fn();
const toast = vi.fn();

vi.mock("../../../core/services/cloudFunctions", () => ({ tmdbProxy: (...a: unknown[]) => tmdbProxy(...a) }));
vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  recordWatchLater: (...a: unknown[]) => recordWatchLater(...a),
  recordWatched: (...a: unknown[]) => recordWatched(...a),
}));
vi.mock("../../../core/services/streak", () => ({ recordStreakInteraction: (...a: unknown[]) => recordStreakInteraction(...a) }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/TmdbAttribution", () => ({ TmdbAttribution: () => null }));
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "u1" }, profile: { preferences: { region: "US" } } }) }));

import { CategoryPage } from "./CategoryPage";
import { DiscoverPage } from "./DiscoverPage";

// jsdom has no <dialog> modal support.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

const film = (id: number, extra: Record<string, unknown> = {}) => ({ id, title: `Film ${id}`, poster_path: `/p${id}.jpg`, backdrop_path: `/b${id}.jpg`, release_date: "2020-05-05", vote_average: 7.4, genre_ids: [18], original_language: "en", overview: "", ...extra });
const page = (ids: number[]) => ({ results: ids.map((i) => film(i)) });

function wire(lists: Record<string, number[]>) {
  tmdbProxy.mockImplementation(async (path: string, params: Record<string, unknown> = {}) => {
    if (path.startsWith("/movie/") && /\d+$/.test(path)) return { id: Number(path.split("/")[2]), title: "Detail", overview: "About it", genres: [], videos: { results: [] }, credits: { cast: [] }, "watch/providers": { results: {} } };
    if (path === "/search/movie") return page([params.query === "dune" ? 900 : 901]);
    return (params.page as number) === 1 ? page(lists[path] ?? []) : { results: [] };
  });
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/app/discover" element={<DiscoverPage />} />
        <Route path="/app/discover/:category" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  loadUserCollections.mockResolvedValue({ watched: [{ movieId: 2 }], watchLater: [{ movieId: 3 }], dismissed: [], letterboxdIds: [4] });
  recordWatchLater.mockResolvedValue(undefined);
  recordWatched.mockResolvedValue(undefined);
  recordStreakInteraction.mockResolvedValue({ kind: "skipped" });
  wire({ "/trending/movie/week": [1, 2, 3, 4, 5], "/movie/top_rated": [5, 6], "/movie/now_playing": [7], "/movie/upcoming": [] });
});
afterEach(cleanup);

describe("Discover", () => {
  it("shows rows without films you've watched, saved or imported, and without repeats across rows", async () => {
    renderAt("/app/discover");
    expect(await screen.findByText("Trending This Week")).toBeTruthy();
    const trending = screen.getByRole("region", { name: "Trending This Week" });
    expect(within(trending).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Film 1, 2020 · ★ 7.4", "Film 5, 2020 · ★ 7.4"]);
    const top = screen.getByRole("region", { name: "Top Rated Classics" });
    expect(within(top).queryByRole("button", { name: /Film 5/ })).toBeNull(); // already shown in Trending
    expect(within(top).getByRole("button", { name: /Film 6/ })).toBeTruthy();
    expect(screen.queryByText("Coming Soon")).toBeNull(); // empty row hidden
  });

  it("features a trending film", async () => {
    renderAt("/app/discover");
    const hero = await screen.findByRole("region", { name: "Featured" });
    expect(within(hero).getByText("Film 1")).toBeTruthy();
  });

  it("searches by title", async () => {
    renderAt("/app/discover?q=dune");
    expect(await screen.findByRole("button", { name: /Film 900/ })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Results for “dune”");
    expect(screen.queryByText("Trending This Week")).toBeNull();
  });

  it("opens a film, saves it to Watch Later and counts the streak", async () => {
    renderAt("/app/discover");
    const trending = await screen.findByRole("region", { name: "Trending This Week" });
    fireEvent.click(within(trending).getByRole("button", { name: /Film 1/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Save to Watch Later" }));
    await waitFor(() => expect(recordWatchLater).toHaveBeenCalledTimes(1));
    expect(recordWatchLater.mock.calls[0][1]).toMatchObject({ id: 1, title: "Film 1" });
    expect(recordWatchLater.mock.calls[0][2]).toEqual({ dismissed: false });
    expect(toast).toHaveBeenCalledWith("success", "Added to Watch Later");
    expect(recordStreakInteraction).toHaveBeenCalledWith("u1");
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Trending This Week" })).queryByRole("button", { name: /Film 1,/ })).toBeNull());
  });

  it("keeps the dialog open and says so when saving fails", async () => {
    recordWatchLater.mockRejectedValue(new Error("denied"));
    renderAt("/app/discover");
    const trending = await screen.findByRole("region", { name: "Trending This Week" });
    fireEvent.click(within(trending).getByRole("button", { name: /Film 1/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Save to Watch Later" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("error", expect.any(String)));
    expect(screen.getByRole("button", { name: "Save to Watch Later" })).toBeTruthy();
  });

  it("shows a loading failure with retry when every list fails", async () => {
    tmdbProxy.mockRejectedValue(new Error("offline"));
    renderAt("/app/discover");
    expect(await screen.findByText("Couldn't load Discover")).toBeTruthy();
  });
});

describe("See all", () => {
  it("lists a category without films you've seen", async () => {
    renderAt("/app/discover/trending");
    expect(await screen.findByRole("button", { name: /Film 1,/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Film 2,/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Film 3,/ })).toBeNull();
    expect(screen.getByText("That's everything.")).toBeTruthy();
  });

  it("sends an unknown category back to Discover", async () => {
    renderAt("/app/discover/nonsense");
    expect(await screen.findByText("Trending This Week")).toBeTruthy();
  });
});
