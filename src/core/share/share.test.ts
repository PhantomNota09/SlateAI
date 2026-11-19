// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("../analytics/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));
vi.mock("../config/site", () => ({ absoluteUrl: (p: string) => `https://example.test${p}` }));

import { buildShareLink, shareLink } from "./share";

const input = { path: "/u/ada", surface: "profile_link" as const, contentType: "profile" as const, title: "t", text: "x" };

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
});

describe("buildShareLink", () => {
  it("uses the site URL and the src/from/c convention", () => {
    expect(buildShareLink("/u/ada", "profile_link")).toBe("https://example.test/u/ada?src=share&from=web&c=profile_link");
  });
});

describe("shareLink", () => {
  it("copies the link when the Web Share API is missing, and reports completion", async () => {
    expect(await shareLink(input)).toBe("copied");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.test/u/ada?src=share&from=web&c=profile_link");
    expect(track).toHaveBeenCalledWith({ name: "share_created", params: { surface: "profile_link", content_type: "profile" } });
    expect(track).toHaveBeenCalledWith({ name: "share_completed", params: { surface: "profile_link", method: "copy_link" } });
  });

  it("uses the native sheet and reports completion when it resolves", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    expect(await shareLink(input)).toBe("shared");
    expect(track).toHaveBeenCalledWith({ name: "share_completed", params: { surface: "profile_link", method: "native_sheet" } });
  });

  it("does not report completion when the sheet is cancelled", async () => {
    Object.defineProperty(navigator, "share", { value: vi.fn().mockRejectedValue(new DOMException("x", "AbortError")), configurable: true });
    expect(await shareLink(input)).toBe("cancelled");
    expect(track).toHaveBeenCalledTimes(1);
  });
});
