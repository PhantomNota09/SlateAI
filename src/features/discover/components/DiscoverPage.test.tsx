// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const tmdbProxy = vi.fn();
const loadUserCollections = vi.fn();
const recordWatchLater = vi.fn();
const recordWatched = vi.fn();
const recordStreakInteraction = vi.fn();
const toast = vi.fn();
const players: { options: { videoId: string; playerVars?: Record<string, unknown>; events: { onReady: (e: { target: unknown }) => void; onStateChange: (e: { data: number }) => void } }; api: { mute: ReturnType<typeof vi.fn>; unMute: ReturnType<typeof vi.fn>; playVideo: ReturnType<typeof vi.fn>; pauseVideo: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> } }[] = [];

vi.mock("../../../core/services/cloudFunctions", () => ({ tmdbProxy: (...a: unknown[]) => tmdbProxy(...a) }));
vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  recordWatchLater: (...a: unknown[]) => recordWatchLater(...a),
  recordWatched: (...a: unknown[]) => recordWatched(...a),
}));
vi.mock("../../../core/services/youtube", () => ({
  loadYouTubeApi: async () => ({
    PlayerState: { PLAYING: 1, ENDED: 0 },
    Player: function (this: unknown, _el: unknown, options: (typeof players)[number]["options"]) {
      const api = { mute: vi.fn(), unMute: vi.fn(), playVideo: vi.fn(), pauseVideo: vi.fn(), destroy: vi.fn() };
      players.push({ options, api });
      Object.assign(this as object, api);
    },
  }),
}));
vi.mock("../../../core/services/streak", () => ({ recordStreakInteraction: (...a: unknown[]) => recordStreakInteraction(...a) }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
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

function wire(lists: Record<string, number[]>, trailer: string | null = null) {
  tmdbProxy.mockImplementation(async (path: string, params: Record<string, unknown> = {}) => {
    if (path.startsWith("/movie/") && /\d+$/.test(path)) return { id: Number(path.split("/")[2]), title: "Detail", overview: "About it", genres: [], videos: { results: trailer ? [{ site: "YouTube", type: "Trailer", key: trailer }] : [] }, credits: { cast: [] }, "watch/providers": { results: {} } };
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
  players.length = 0;
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

  // Lets a test say how much of the banner is on screen.
  let intersect: (ratio: number) => void = () => undefined;
  const stubIntersectionObserver = () => {
    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: (e: { intersectionRatio: number }[]) => void) { intersect = (ratio) => cb([{ intersectionRatio: ratio }]); }
      observe() {}
      disconnect() {}
    });
  };

  const trailerWire = (id: number) => wire({ "/trending/movie/week": [id, id + 100], "/movie/top_rated": [], "/movie/now_playing": [], "/movie/upcoming": [] }, "abc123"); // ids are unique per test: film details are cached across renders

  it("plays the featured trailer once, muted, only after the banner is mostly on screen", async () => {
    stubIntersectionObserver();
    trailerWire(11);
    renderAt("/app/discover");
    await waitFor(() => expect(players).toHaveLength(1));
    const { options, api } = players[0];
    expect(options.videoId).toBe("abc123");
    expect(options.playerVars).not.toHaveProperty("loop");
    expect(options.playerVars).not.toHaveProperty("autoplay");

    act(() => intersect(0.2));
    act(() => options.events.onReady({ target: api }));
    expect(api.mute).toHaveBeenCalled();
    expect(api.playVideo).not.toHaveBeenCalled(); // under half visible: no autoplay yet
    act(() => intersect(0.6));
    expect(api.playVideo).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows a mute toggle once the trailer is playing", async () => {
    trailerWire(15);
    renderAt("/app/discover");
    await waitFor(() => expect(players).toHaveLength(1));
    expect(screen.queryByRole("button", { name: /trailer/ })).toBeNull(); // nothing to toggle until it plays

    act(() => players[0].options.events.onStateChange({ data: 1 }));
    fireEvent.click(await screen.findByRole("button", { name: "Unmute trailer" }));
    expect(players[0].api.unMute).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Mute trailer" }));
    expect(players[0].api.mute).toHaveBeenCalled();
  });

  it("goes back to the cover when the trailer ends, and doesn't replay it", async () => {
    trailerWire(16);
    renderAt("/app/discover");
    await waitFor(() => expect(players).toHaveLength(1));
    act(() => players[0].options.events.onStateChange({ data: 1 }));
    await screen.findByRole("button", { name: "Unmute trailer" });

    act(() => players[0].options.events.onStateChange({ data: 0 })); // ended
    expect(players[0].api.destroy).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /trailer/ })).toBeNull();
    expect(document.querySelector(".disc__hero-video")?.classList.contains("is-playing")).toBe(false);
    expect(players).toHaveLength(1); // no second player
  });

  it("View details stops the trailer at once and opens the film", async () => {
    trailerWire(17);
    renderAt("/app/discover");
    await waitFor(() => expect(players).toHaveLength(1));
    act(() => players[0].options.events.onStateChange({ data: 1 }));
    await screen.findByRole("button", { name: "Unmute trailer" });

    fireEvent.click(within(screen.getByRole("region", { name: "Featured" })).getByRole("button", { name: "View details" }));
    expect(players[0].api.destroy).toHaveBeenCalled();
    expect(document.querySelector(".disc__hero-video")?.classList.contains("is-stopped")).toBe(true);
    expect(await screen.findByRole("button", { name: "Save to Watch Later" })).toBeTruthy(); // the dialog opened
  });

  it("stays on the still image when the film has no trailer", async () => {
    wire({ "/trending/movie/week": [14], "/movie/top_rated": [], "/movie/now_playing": [], "/movie/upcoming": [] });
    renderAt("/app/discover");
    await screen.findByRole("region", { name: "Featured" });
    await waitFor(() => expect(tmdbProxy).toHaveBeenCalledWith("/movie/14", expect.anything()));
    expect(players).toHaveLength(0);
  });

  it("doesn't autoplay for visitors who prefer reduced motion", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    wire({ "/trending/movie/week": [13], "/movie/top_rated": [], "/movie/now_playing": [], "/movie/upcoming": [] }, "abc123");
    renderAt("/app/discover");
    await waitFor(() => expect(tmdbProxy).toHaveBeenCalledWith("/movie/13", expect.anything()));
    await screen.findByRole("region", { name: "Featured" });
    expect(players).toHaveLength(0);
    window.matchMedia = original;
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
