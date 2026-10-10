// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadLetterboxdIds = vi.fn();
const commitLetterboxdMovies = vi.fn();
const updateLetterboxdMetadata = vi.fn();
const searchMovie = vi.fn();
const refreshProfile = vi.fn();

vi.mock("../../../core/services/letterboxd", () => ({
  loadLetterboxdIds: (...a: unknown[]) => loadLetterboxdIds(...a),
  commitLetterboxdMovies: (...a: unknown[]) => commitLetterboxdMovies(...a),
  updateLetterboxdMetadata: (...a: unknown[]) => updateLetterboxdMetadata(...a),
}));
vi.mock("../tmdbSearch", () => ({ searchMovie: (...a: unknown[]) => searchMovie(...a) }));
// No waiting between lookups in tests.
vi.mock("../importRunner", async (orig) => {
  const mod = await orig<typeof import("../importRunner")>();
  return { ...mod, runImport: (o: Parameters<typeof mod.runImport>[0]) => mod.runImport({ ...o, minIntervalMs: 0 }) };
});
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/TmdbAttribution", () => ({ TmdbAttribution: () => null }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1" },
    refreshProfile,
    profile: { status: "ready", isOnboarded: true, preferences: { letterboxdTotalMoviesImported: 12, letterboxdFullImportDate: { toDate: () => new Date(2026, 0, 5) } } },
  }),
}));

import { LetterboxdImportProvider, useImportProgress } from "../context/LetterboxdImportContext";
import { LetterboxdPage } from "./LetterboxdPage";

const Page = () => <LetterboxdImportProvider><LetterboxdPage /></LetterboxdImportProvider>;

const CSV = "Date,Name,Year,Letterboxd URI,Rating\n2021-03-01,Heat,1995,u,4.5\n2021-03-02,Alien,1979,u,5\n2021-03-03,Unknown Film,2001,u,3\n";
const csvFile = (text: string, name = "ratings.csv") => new File([text], name, { type: "text/csv" });
const chooseFile = (file: File) => fireEvent.change(screen.getByLabelText("Choose ratings.csv"), { target: { files: [file] } });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  loadLetterboxdIds.mockResolvedValue(new Set([2]));
  commitLetterboxdMovies.mockResolvedValue(undefined);
  updateLetterboxdMetadata.mockResolvedValue(undefined);
  refreshProfile.mockResolvedValue(undefined);
  searchMovie.mockImplementation(async (title: string) =>
    title === "Heat" ? { id: 1, title: "Heat", posterPath: "/h.jpg" } : title === "Alien" ? { id: 2, title: "Alien", posterPath: null } : null,
  );
});
afterEach(cleanup);

describe("LetterboxdPage", () => {
  it("shows the previous import and the export steps", () => {
    render(<Page />);
    expect(screen.getByText("12 movies imported")).toBeTruthy();
    expect(screen.getByText(/How to export from Letterboxd/)).toBeTruthy();
  });

  it("rejects the wrong file with a clear message", async () => {
    render(<Page />);
    chooseFile(csvFile("Date,Name,Year,Letterboxd URI\n2020-01-01,Heat,1995,u", "watched.csv"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/ratings\.csv/);
  });

  it("imports, saves only new matches, and summarises", async () => {
    render(<Page />);
    chooseFile(csvFile(CSV));
    expect(await screen.findByText(/has 3 films/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Start import" }));
    expect(await screen.findByText("Import complete")).toBeTruthy();

    expect(commitLetterboxdMovies).toHaveBeenCalledTimes(1);
    const [uid, saved] = commitLetterboxdMovies.mock.calls[0];
    expect(uid).toBe("u1");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ movieId: 1, title: "Heat", letterboxdRating: 4.5 });
    expect(updateLetterboxdMetadata).toHaveBeenCalledWith("u1", 2);
    expect(refreshProfile).toHaveBeenCalled();

    const results = screen.getByText("Added").closest("dl")!.textContent!;
    expect(results).toContain("Added1");
    expect(results).toContain("Already in Slate1");
    expect(results).toContain("Not matched1");

    fireEvent.click(screen.getByRole("button", { name: /Show films we couldn't match/ }));
    expect(screen.getByText("Unknown Film (2001)")).toBeTruthy();
  });

  it("writes nothing when every film is already imported", async () => {
    loadLetterboxdIds.mockResolvedValue(new Set([1, 2]));
    render(<Page />);
    chooseFile(csvFile(CSV));
    fireEvent.click(await screen.findByRole("button", { name: "Start import" }));
    await screen.findByText("Import complete");
    expect(commitLetterboxdMovies).not.toHaveBeenCalled();
    expect(updateLetterboxdMetadata).not.toHaveBeenCalled();
  });

  it("explains a failed save and lets the user start over", async () => {
    commitLetterboxdMovies.mockRejectedValue(new Error("denied"));
    render(<Page />);
    chooseFile(csvFile(CSV));
    fireEvent.click(await screen.findByRole("button", { name: "Start import" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/couldn't save/));
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByLabelText("Choose ratings.csv")).toBeTruthy();
  });

  it("keeps importing after the page is left, and shows progress elsewhere", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => { release = r; });
    searchMovie.mockImplementation(async (title: string) => { await gate; return title === "Heat" ? { id: 1, title: "Heat", posterPath: null } : null; });

    function Elsewhere() {
      const p = useImportProgress();
      return <p>{p ? `importing ${p.current}/${p.total}` : "idle"}</p>;
    }
    function App({ onPage }: { onPage: boolean }) {
      return <LetterboxdImportProvider>{onPage ? <LetterboxdPage /> : <Elsewhere />}</LetterboxdImportProvider>;
    }
    const view = render(<App onPage />);
    chooseFile(csvFile(CSV));
    fireEvent.click(await screen.findByRole("button", { name: "Start import" }));
    await screen.findByText(/Matching your films/);

    // Same provider, different screen: the import must not be cancelled.
    view.rerender(<App onPage={false} />);
    expect(await screen.findByText(/importing \d+\/3/)).toBeTruthy();
    release();
    await waitFor(() => expect(commitLetterboxdMovies).toHaveBeenCalledTimes(1));
    expect(updateLetterboxdMetadata).toHaveBeenCalled();
    await screen.findByText("idle");
  });

  it("offers to continue where an interrupted import of the same file stopped", async () => {
    localStorage.setItem("slate.letterboxd-import.u1", JSON.stringify({ sig: "ratings.csv|" + CSV.length + "|3", processed: 2 }));
    render(<Page />);
    chooseFile(csvFile(CSV));
    expect(await screen.findByText(/already got through 2 of them/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue import" }));
    await screen.findByText("Import complete");
    expect(searchMovie).toHaveBeenCalledTimes(1); // only the third film
    expect(localStorage.getItem("slate.letterboxd-import.u1")).toBeNull(); // finished: cleared
  });
});
