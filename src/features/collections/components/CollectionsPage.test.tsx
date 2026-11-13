// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseFranchisePayload } from "../../../core/models/Franchise";

const useFranchises = vi.fn();
vi.mock("../hooks/useFranchises", () => ({ useFranchises: () => useFranchises() }));
vi.mock("../hooks/useCollectionProgress", () => ({ useCollectionProgress: () => ({ watched: new Set([1]), markWatched: vi.fn() }) }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { CollectionsPage } from "./CollectionsPage";

const part = (id: number) => ({ id, title: `Film ${id}`, posterPath: null, backdropPath: null, releaseDate: null, voteAverage: 0 });
const franchises = parseFranchisePayload({
  version: "v",
  franchises: [
    { id: "mcu", displayName: "Marvel Cinematic Universe", categories: ["Superhero", "Action"], parts: [part(1), part(2)] },
    { id: "scream", displayName: "Scream", categories: ["Horror"], parts: [part(3)] },
  ],
})!.franchises;

beforeEach(() => useFranchises.mockReturnValue({ franchises, loading: false, failed: false, retry: vi.fn(), refresh: vi.fn() }));
afterEach(cleanup);

const renderPage = () => render(<MemoryRouter><CollectionsPage /></MemoryRouter>);

describe("CollectionsPage", () => {
  it("shows progress for each franchise", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Marvel Cinematic Universe, 1 of 2 watched" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Scream, 0 of 1 watched" })).toBeTruthy();
  });

  it("filters by category and by search", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Horror" }));
    expect(screen.queryByText("Marvel Cinematic Universe")).toBeNull();
    expect(screen.getByText("Scream")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByLabelText("Search franchises"), { target: { value: "marvel" } });
    expect(screen.queryByText("Scream")).toBeNull();
    expect(screen.getByText("Marvel Cinematic Universe")).toBeTruthy();
  });

  it("offers a retry when nothing could be loaded", () => {
    const retry = vi.fn();
    useFranchises.mockReturnValue({ franchises: null, loading: false, failed: true, retry, refresh: vi.fn() });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /try again|retry/i }));
    expect(retry).toHaveBeenCalled();
  });
});
