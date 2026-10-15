// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavSearch } from "./NavSearch";

function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname + l.search}</output>;
}
const renderAt = (url: string) => render(<MemoryRouter initialEntries={[url]}><NavSearch /><Where /></MemoryRouter>);
const where = () => screen.getByTestId("where").textContent;
const type = (value: string) => fireEvent.change(screen.getByLabelText("Search movies"), { target: { value } });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("NavSearch", () => {
  it("starts as a magnifier and opens an input when clicked", () => {
    renderAt("/app/watch-later");
    expect(screen.queryByLabelText("Search movies")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Search movies"));
  });

  it("takes you to Discover results once you pause typing", () => {
    renderAt("/app/watch-later");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    type("dune");
    expect(where()).toBe("/app/watch-later"); // still typing
    act(() => void vi.advanceTimersByTime(300));
    expect(where()).toBe("/app/discover?q=dune");
  });

  it("searches straight away on Enter, and encodes the query", () => {
    renderAt("/app/discover");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    type("mad max & co");
    fireEvent.submit(screen.getByRole("search"));
    expect(where()).toBe("/app/discover?q=mad%20max%20%26%20co");
  });

  it("opens already filled in when the page is a search result", () => {
    renderAt("/app/discover?q=alien");
    expect((screen.getByLabelText("Search movies") as HTMLInputElement).value).toBe("alien");
  });

  it("clears the box with the X and keeps it open", () => {
    renderAt("/app/discover?q=alien");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect((screen.getByLabelText("Search movies") as HTMLInputElement).value).toBe("");
    act(() => void vi.advanceTimersByTime(300));
    expect(where()).toBe("/app/discover");
    expect(screen.getByLabelText("Search movies")).toBeTruthy();
  });

  it("closes and drops the query on Escape", () => {
    renderAt("/app/discover?q=alien");
    fireEvent.keyDown(screen.getByLabelText("Search movies"), { key: "Escape" });
    expect(where()).toBe("/app/discover");
    expect(screen.queryByLabelText("Search movies")).toBeNull();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
  });
});
