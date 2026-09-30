// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let authListener: ((user: { uid: string } | null) => void) | null = null;
const readProfile = vi.fn();
const currentUser = { uid: "u1" };

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: { uid: string } | null) => void) => {
    authListener = cb;
    return () => undefined;
  },
}));
vi.mock("../../../core/services/firebase", () => ({ auth: { get currentUser() { return currentUser; } } }));
vi.mock("../../../core/services/firestore", () => ({ readProfile: (...a: unknown[]) => readProfile(...a) }));

import { AuthProvider, useAuth } from "./AuthContext";

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const missing = { status: "missing", isOnboarded: false, preferences: null };
const ready = { status: "ready", isOnboarded: false, preferences: { username: "sam" } };

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  authListener = null;
});

describe("AuthProvider profile loading", () => {
  it("keeps the fresh profile when a slower, older read finishes last (post-sign-up race)", async () => {
    const stale = deferred<typeof missing>(); // read started at account creation, before the profile existed
    readProfile.mockReturnValueOnce(stale.promise).mockResolvedValueOnce(ready);
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { void authListener!({ uid: "u1" }); }); // account created -> stale read in flight (do not await it)
    await act(async () => { await result.current.refreshProfile(); }); // signup finished -> fresh read
    await waitFor(() => expect(result.current.profile.status).toBe("ready"));

    await act(async () => { stale.resolve(missing); }); // the old read finally returns "missing"
    expect(result.current.profile.status).toBe("ready"); // must NOT be overwritten
  });

  it("reports a failed read as an error, not as a missing profile", async () => {
    readProfile.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { authListener!({ uid: "u1" }); });
    await waitFor(() => expect(result.current.profileError).toBe(true));
    expect(result.current.profile.status).toBe("missing");
  });

  it("clears the profile on sign-out", async () => {
    readProfile.mockResolvedValue(ready);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { authListener!({ uid: "u1" }); });
    await waitFor(() => expect(result.current.profile.status).toBe("ready"));
    await act(async () => { authListener!(null); });
    await waitFor(() => expect(result.current.profile.status).toBe("missing"));
  });
});
