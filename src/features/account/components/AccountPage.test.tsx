// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateDisplayName = vi.fn();
const changePassword = vi.fn();
const deleteAccount = vi.fn();
const refreshProfile = vi.fn();
const toast = vi.fn();
let passwordUser = true;

vi.mock("../../../core/services/account", () => ({
  MAX_NAME_LENGTH: 50,
  updateDisplayName: (...a: unknown[]) => updateDisplayName(...a),
  changePassword: (...a: unknown[]) => changePassword(...a),
  hasPasswordSignIn: () => passwordUser,
  providerOf: () => (passwordUser ? "password" : "google"),
  deleteAccount: (...a: unknown[]) => deleteAccount(...a),
}));
vi.mock("../../../core/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../../../core/components/Toast", () => ({ useToast: () => toast }));
vi.mock("../../auth/components/ProtectedRoute", () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../../auth/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "a@b.co" },
    profile: { preferences: { name: "Ada", email: "a@b.co", username: "ada_l" } },
    refreshProfile,
  }),
}));

import { AccountPage } from "./AccountPage";

beforeEach(() => {
  vi.clearAllMocks();
  passwordUser = true;
  updateDisplayName.mockResolvedValue(undefined);
  changePassword.mockResolvedValue(undefined);
  deleteAccount.mockResolvedValue(undefined);
  refreshProfile.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("AccountPage", () => {
  it("shows email and username, and saves a trimmed new name", async () => {
    render(<AccountPage />);
    expect(screen.getByText("@ada_l")).toBeTruthy();
    const save = screen.getByRole("button", { name: "Save name" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true); // nothing changed yet
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Ada Lovelace " } });
    fireEvent.click(save);
    await waitFor(() => expect(updateDisplayName).toHaveBeenCalledWith("u1", "Ada Lovelace"));
    expect(refreshProfile).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("success", "Name updated.");
  });

  it("won't save an empty name", () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    expect((screen.getByRole("button", { name: "Save name" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Enter your name.")).toBeTruthy();
  });

  it("changes the password and clears the fields", async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "OldPass1x" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "NewPass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith("OldPass1x", "NewPass123"));
    await waitFor(() => expect((screen.getByLabelText("Current password") as HTMLInputElement).value).toBe(""));
  });

  it("explains a wrong current password and rejects a weak new one before calling Firebase", async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrong" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/doesn't meet all the requirements/)).toBeTruthy();
    expect(changePassword).not.toHaveBeenCalled();

    changePassword.mockRejectedValue({ code: "auth/invalid-credential" });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "NewPass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Your current password is incorrect.")).toBeTruthy();
  });

  it("hides the password form for Google or Apple accounts", () => {
    passwordUser = false;
    render(<AccountPage />);
    expect(screen.queryByLabelText("Current password")).toBeNull();
    expect(screen.getByText(/no Slate password to change/)).toBeTruthy();
  });

  it("deletes the account only after the password is confirmed", async () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect((screen.getByRole("button", { name: "Permanently delete" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Confirm with your password"), { target: { value: "MyPass123" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete" }));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith(expect.objectContaining({ uid: "u1" }), "MyPass123"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("success", "Your account has been deleted."));
  });

  it("uses Google to confirm for Google accounts, and explains a wrong password", async () => {
    passwordUser = false;
    render(<AccountPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete" }));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith(expect.anything(), undefined));
    cleanup();

    passwordUser = true;
    deleteAccount.mockRejectedValue({ code: "auth/invalid-credential" });
    render(<AccountPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    fireEvent.change(screen.getByLabelText("Confirm with your password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Permanently delete" }));
    expect(await screen.findByText("That password is incorrect.")).toBeTruthy();
  });

  it("can back out of deleting", () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Delete my account" })).toBeTruthy();
    expect(deleteAccount).not.toHaveBeenCalled();
  });
});
