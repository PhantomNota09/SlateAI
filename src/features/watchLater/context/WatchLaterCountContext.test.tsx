// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let push: (n: number) => void = () => undefined;
let fail: (e: unknown) => void = () => undefined;
const unsubscribe = vi.fn();
const subscribe = vi.fn();
let uid: string | undefined = "u1";

vi.mock("../../../core/services/userCollections", () => ({
  subscribeWatchLaterCount: (...a: unknown[]) => subscribe(...a),
}));
vi.mock("../../auth/context/AuthContext", () => ({ useAuth: () => ({ user: uid ? { uid } : null }) }));

import { useWatchLaterCount, WatchLaterCountProvider } from "./WatchLaterCountContext";

const Badge = () => <p>{useWatchLaterCount() ?? "none"}</p>;
const page = () => <WatchLaterCountProvider><Badge /></WatchLaterCountProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  uid = "u1";
  subscribe.mockImplementation((_u: string, onCount: (n: number) => void, onError: (e: unknown) => void) => {
    push = onCount;
    fail = onError;
    return unsubscribe;
  });
});
afterEach(cleanup);

describe("WatchLaterCountProvider", () => {
  it("shows no number until the first snapshot, then follows the live count", () => {
    render(page());
    expect(screen.getByText("none")).toBeTruthy();
    act(() => push(14));
    expect(screen.getByText("14")).toBeTruthy();
    act(() => push(15)); // saved a film from another page or device
    expect(screen.getByText("15")).toBeTruthy();
    act(() => push(0));
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("listens once for the signed-in user and stops on unmount", () => {
    const view = render(page());
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe.mock.calls[0][0]).toBe("u1");
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("drops the number if the listener fails rather than showing a stale one", () => {
    render(page());
    act(() => push(7));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    act(() => fail(new Error("denied")));
    expect(screen.getByText("none")).toBeTruthy();
  });

  it("does not listen when nobody is signed in", () => {
    uid = undefined;
    render(page());
    expect(subscribe).not.toHaveBeenCalled();
    expect(screen.getByText("none")).toBeTruthy();
  });
});
