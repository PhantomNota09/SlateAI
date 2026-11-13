// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let source: string | undefined;
const loadLetterboxdIds = vi.fn();
const commitLetterboxdMovies = vi.fn();
const updateLetterboxdMetadata = vi.fn();
const searchMovie = vi.fn();

vi.mock("../../../core/services/letterboxd", () => ({
  loadLetterboxdIds: (...a: unknown[]) => loadLetterboxdIds(...a),
  commitLetterboxdMovies: (...a: unknown[]) => commitLetterboxdMovies(...a),
  updateLetterboxdMetadata: (...a: unknown[]) => updateLetterboxdMetadata(...a),
}));
vi.mock("../tmdbSearch", () => ({ searchMovie: (...a: unknown[]) => searchMovie(...a) }));
vi.mock("../importRunner", async (orig) => {
  const mod = await orig<typeof import("../importRunner")>();
  return { ...mod, runImport: (o: Parameters<typeof mod.runImport>[0]) => mod.runImport({ ...o, minIntervalMs: 0 }) };
});
vi.mock("../../../core/components/TmdbAttribution", () => ({ TmdbAttribution: () => null }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "u1" }, refreshProfile: async () => undefined, profile: { status: "ready", isOnboarded: true, preferences: { letterboxdImportSource: source } } }),
}));

import { LetterboxdImportProvider } from "../context/LetterboxdImportContext";
import { LetterboxdPrompt } from "./LetterboxdPrompt";
import { WelcomePage } from "./WelcomePage";

const CSV = "Date,Name,Year,Letterboxd URI,Rating\n2021-03-01,Heat,1995,u,4.5\n";
const csvFile = () => new File([CSV], "ratings.csv", { type: "text/csv" });

const app = (initial: string) => (
  <MemoryRouter initialEntries={[initial]}>
    <LetterboxdImportProvider>
      <Routes>
        <Route path="/app/welcome" element={<WelcomePage />} />
        <Route path="/app/recommendations" element={<><p>For You page</p><LetterboxdPrompt /></>} />
        <Route path="/app/letterboxd" element={<p>Letterboxd page</p>} />
      </Routes>
    </LetterboxdImportProvider>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  source = undefined;
  loadLetterboxdIds.mockResolvedValue(new Set());
  commitLetterboxdMovies.mockResolvedValue(undefined);
  updateLetterboxdMetadata.mockResolvedValue(undefined);
  searchMovie.mockResolvedValue({ id: 1, title: "Heat", posterPath: null });
});
afterEach(cleanup);

describe("Welcome (after onboarding)", () => {
  it("offers the import, and skipping goes straight to For You", () => {
    render(app("/app/welcome"));
    expect(screen.getByText(/Do you use Letterboxd/)).toBeTruthy();
    expect(screen.getByLabelText("Choose ratings.csv")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(screen.getByText("For You page")).toBeTruthy();
  });

  it("starts an import here and lets the user carry on to For You while it runs", async () => {
    render(app("/app/welcome"));
    fireEvent.change(screen.getByLabelText("Choose ratings.csv"), { target: { files: [csvFile()] } });
    fireEvent.click(await screen.findByRole("button", { name: "Start import" }));
    expect(await screen.findByText("Import complete")).toBeTruthy();
    expect(commitLetterboxdMovies).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Continue to For You" }));
    expect(screen.getByText("For You page")).toBeTruthy();
  });

  it("skips the page for anyone who has already imported", () => {
    source = "csv";
    render(app("/app/welcome"));
    expect(screen.getByText("For You page")).toBeTruthy();
  });
});

describe("Letterboxd card on For You", () => {
  it("shows for people who haven't imported and links to the import page", () => {
    render(app("/app/recommendations"));
    expect(screen.getByText(/On Letterboxd/)).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Import" }));
    expect(screen.getByText("Letterboxd page")).toBeTruthy();
  });

  it("stays dismissed", () => {
    const first = render(app("/app/recommendations"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/On Letterboxd/)).toBeNull();
    first.unmount();
    render(app("/app/recommendations"));
    expect(screen.queryByText(/On Letterboxd/)).toBeNull();
  });

  it("never shows to someone who has imported", () => {
    source = "both";
    render(app("/app/recommendations"));
    expect(screen.queryByText(/On Letterboxd/)).toBeNull();
  });
});
