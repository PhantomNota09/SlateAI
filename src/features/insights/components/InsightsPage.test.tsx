// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadUserCollections = vi.fn();
const loadLetterboxdMovies = vi.fn();
const loadUserStats = vi.fn();
const tmdbProxy = vi.fn();
const generateAnalyticsInsights = vi.fn();

vi.mock("../../../core/services/userCollections", () => ({ loadUserCollections: (...a: unknown[]) => loadUserCollections(...a) }));
vi.mock("../../../core/services/letterboxd", () => ({ loadLetterboxdMovies: (...a: unknown[]) => loadLetterboxdMovies(...a) }));
vi.mock("../../../core/services/userStats", () => ({ loadUserStats: (...a: unknown[]) => loadUserStats(...a) }));
vi.mock("../../../core/services/cloudFunctions", () => ({
  tmdbProxy: (...a: unknown[]) => tmdbProxy(...a),
  generateAnalyticsInsights: (...a: unknown[]) => generateAnalyticsInsights(...a),
}));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));

import { InsightsPage } from "./InsightsPage";

const watched = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ movieId: i + 1, title: `M${i + 1}`, posterPath: null, rating: 4, watchedAt: new Date(2026, 5, 1 + i) }));
const renderPage = () => render(<MemoryRouter><InsightsPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  loadLetterboxdMovies.mockResolvedValue([]);
  loadUserStats.mockResolvedValue({ currentStreak: 3, topGenres: ["Drama"] });
  tmdbProxy.mockImplementation(async (path: string) => ({ id: Number(path.split("/")[2]), genres: [{ id: 18, name: "Drama" }], release_date: "1999-01-01", original_language: "en", runtime: 100, vote_average: 8 }));
  generateAnalyticsInsights.mockResolvedValue({ personalityInsights: ["Drama Devotee"], tasteProfile: "You love drama.", recommendedNextSteps: ["Try a thriller"] });
});
afterEach(cleanup);

describe("InsightsPage", () => {
  it("asks for more ratings below five films, with a way to get there", async () => {
    loadUserCollections.mockResolvedValue({ watched: watched(3) });
    renderPage();
    expect(await screen.findByText(/Rate 2 more films/)).toBeTruthy();
    expect(screen.getByText("Import from Letterboxd")).toBeTruthy();
    expect(tmdbProxy).not.toHaveBeenCalled();
  });

  it("counts imported Letterboxd films toward the minimum", async () => {
    loadUserCollections.mockResolvedValue({ watched: watched(3) });
    loadLetterboxdMovies.mockResolvedValue([10, 11].map((id) => ({ movieId: id, title: "x", posterPath: null, letterboxdRating: 3, watchedDate: null, importedAt: new Date(2026, 1, 1) })));
    renderPage();
    expect(await screen.findByText("Films logged")).toBeTruthy();
  });

  it("shows stats and a taste breakdown, then generates AI insights from them", async () => {
    loadUserCollections.mockResolvedValue({ watched: watched(6) });
    renderPage();
    expect(await screen.findByText("Films logged")).toBeTruthy();
    expect(await screen.findByText(/Based on your 6 most recent films/)).toBeTruthy();

    const button = await screen.findByRole("button", { name: "Generate insights" });
    fireEvent.click(button);
    expect(await screen.findByText("You love drama.")).toBeTruthy();
    expect(screen.getByText("Drama Devotee")).toBeTruthy();
    expect(generateAnalyticsInsights).toHaveBeenCalledWith({ totalMovies: 6, averageRating: 4, topGenres: ["Drama"], explorationScore: 5, forceRefresh: false });
  });

  it("explains a daily-limit error", async () => {
    loadUserCollections.mockResolvedValue({ watched: watched(5) });
    generateAnalyticsInsights.mockRejectedValue({ code: "functions/resource-exhausted" });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Generate insights" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/today's limit/));
  });
});
