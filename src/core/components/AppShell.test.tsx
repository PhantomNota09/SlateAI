// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
vi.mock("firebase/auth", () => ({ signOut: (...a: unknown[]) => signOut(...a) }));
vi.mock("../services/firebase", () => ({ auth: {} }));
vi.mock("../../features/friends/hooks/useFriends", () => ({ useIncomingRequestCount: () => 2 }));
vi.mock("../../features/letterboxd/context/LetterboxdImportContext", () => ({ useImportProgress: () => null }));
vi.mock("../../features/auth/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "u1", email: "ada@example.com", displayName: "Ada", providerData: [] }, profile: { preferences: { name: "Ada Lovelace" } } }),
}));

import { AppShell } from "./AppShell";

const renderShell = (path = "/app/recommendations") =>
  render(<MemoryRouter initialEntries={[path]}><AppShell watchLaterCount={3}><p>page</p></AppShell></MemoryRouter>);
afterEach(cleanup);

describe("AppShell navigation", () => {
  it("has exactly four tabs in the top bar, with counts on Watch Later and Friends", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["For You", "Discover", "Watch Later3", "Friends2"]);
  });

  it("puts Profile, History, Preferences, Insights and Letterboxd in the account menu", () => {
    renderShell();
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Profile", "History", "Preferences", "Insights", "Letterboxd", "Sign out"]);
    expect(within(menu).getByRole("menuitem", { name: "History" }).getAttribute("href")).toBe("/app/profile/history");
  });

  it("closes the menu after choosing a page, and signs out from it", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Insights" }));
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("opens the same four tabs from the phone menu button", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const sheet = screen.getByRole("navigation", { name: "Menu" });
    expect(within(sheet).getAllByRole("link")).toHaveLength(4);
  });
});
