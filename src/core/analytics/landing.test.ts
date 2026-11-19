// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("./analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

async function fresh() {
  vi.resetModules();
  return { ...(await import("./consent")), ...(await import("./landing")) };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "globalPrivacyControl", { value: undefined, configurable: true });
});

describe("reportLanding", () => {
  it("waits for consent, then sends once with the parsed attribution", async () => {
    const { reportLanding, writeConsent } = await fresh();
    reportLanding("?src=share&from=ios&c=profile_link");
    expect(track).not.toHaveBeenCalled();
    writeConsent("granted");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({ name: "landing_view", params: { source: "share", origin_platform: "ios" } });
  });

  it("never sends when the visitor declines", async () => {
    const { reportLanding, writeConsent } = await fresh();
    reportLanding("");
    writeConsent("denied");
    expect(track).not.toHaveBeenCalled();
  });

  it("sends immediately when consent was already granted, and only once per load", async () => {
    const { reportLanding, writeConsent } = await fresh();
    writeConsent("granted");
    reportLanding("");
    reportLanding("");
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({ name: "landing_view", params: { source: "direct", origin_platform: "unknown" } });
  });
});
