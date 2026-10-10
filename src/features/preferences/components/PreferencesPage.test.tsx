// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const savePreferenceChanges = vi.fn();
const refreshProfile = vi.fn();
const toast = vi.fn();

vi.mock("../../../core/services/firestore", () => ({ savePreferenceChanges: (...a: unknown[]) => savePreferenceChanges(...a) }));
vi.mock("../../../core/services/cloudFunctions", () => ({ tmdbProxy: vi.fn().mockRejectedValue(new Error("offline")) }));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1" },
    refreshProfile,
    profile: {
      status: "ready",
      isOnboarded: true,
      preferences: { preferredLanguages: ["en"], topGenres: [28], tonePreference: "Mix of both", region: "US", preferredStreamingServices: [] },
    },
  }),
}));

import { PreferencesPage } from "./PreferencesPage";

beforeEach(() => {
  vi.clearAllMocks();
  savePreferenceChanges.mockResolvedValue(undefined);
  refreshProfile.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("PreferencesPage", () => {
  it("saves only the field that changed, then refreshes the profile", async () => {
    render(<PreferencesPage />);
    const save = screen.getByRole("button", { name: "Save changes" });
    expect((save as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Style & tone" }));
    fireEvent.click(screen.getByRole("radio", { name: /Dark\/Serious/ }));
    expect((save as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(save);
    await waitFor(() => expect(savePreferenceChanges).toHaveBeenCalledTimes(1));
    expect(savePreferenceChanges).toHaveBeenCalledWith("u1", { tonePreference: "Dark/Serious" });
    expect(refreshProfile).toHaveBeenCalled();
    await waitFor(() => expect((save as HTMLButtonElement).disabled).toBe(true));
  });

  it("discard puts the saved values back", async () => {
    render(<PreferencesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Style & tone" }));
    fireEvent.click(screen.getByRole("radio", { name: /Dark\/Serious/ }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect((screen.getByRole("radio", { name: /Mix of both/ }) as HTMLInputElement).checked).toBe(true);
    expect(savePreferenceChanges).not.toHaveBeenCalled();
  });

  it("keeps the edits and shows an error when saving fails", async () => {
    savePreferenceChanges.mockRejectedValue(new Error("denied"));
    render(<PreferencesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Style & tone" }));
    fireEvent.click(screen.getByRole("radio", { name: /Dark\/Serious/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't save/i);
    expect((screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
