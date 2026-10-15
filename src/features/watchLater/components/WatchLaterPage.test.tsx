// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadUserCollections = vi.fn();
const toast = vi.fn();
const detailProps = vi.fn();

vi.mock("../../../core/services/userCollections", () => ({
  loadUserCollections: (...a: unknown[]) => loadUserCollections(...a),
  recordWatched: vi.fn(),
  removeWatchLater: vi.fn(),
}));
vi.mock("../../../core/services/streak", () => ({ recordStreakInteraction: vi.fn().mockResolvedValue(null) }));
vi.mock("../../../core/analytics/analytics", () => ({ track: vi.fn() }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "u1" }, profile: { preferences: { region: "gb" } } }) }));
vi.mock("../../recommendations/components/Dialogs", () => ({ RatingDialog: () => null }));
vi.mock("../../discover/components/MovieDetailDialog", () => ({
  MovieDetailDialog: (props: { movie: { title: string } | null; region: string; status: string }) => {
    detailProps(props);
    return props.movie ? <div role="dialog">Detail for {props.movie.title}</div> : null;
  },
}));

import { WatchLaterPage } from "./WatchLaterPage";

const item = { movieId: 7, title: "Saved Film", posterPath: null, voteAverage: 7.4, releaseDate: "2020-05-01", addedAt: new Date(2026, 0, 1) };

beforeEach(() => {
  vi.clearAllMocks();
  loadUserCollections.mockResolvedValue({ watchLater: [item] });
});
afterEach(cleanup);

describe("WatchLaterPage", () => {
  it("opens the film's detail view from its card, in the user's region", async () => {
    render(<MemoryRouter><WatchLaterPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Details for Saved Film" }));
    await waitFor(() => expect(screen.getByRole("dialog").textContent).toContain("Saved Film"));
    expect(detailProps).toHaveBeenLastCalledWith(expect.objectContaining({ region: "GB", status: "saved" }));
  });
});
