// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const logEvent = vi.fn();
const initializeAnalytics = vi.fn(() => ({ id: "analytics" }));
const setAnalyticsCollectionEnabled = vi.fn();
const initializeApp = vi.fn(() => ({ name: "analytics" }));

vi.mock("firebase/analytics", () => ({
  isSupported: async () => true,
  initializeAnalytics: (...a: unknown[]) => (initializeAnalytics as (...x: unknown[]) => unknown)(...a),
  setAnalyticsCollectionEnabled: (...a: unknown[]) => setAnalyticsCollectionEnabled(...a),
  logEvent: (...a: unknown[]) => logEvent(...a),
}));
vi.mock("firebase/app", () => ({ initializeApp: (...a: unknown[]) => (initializeApp as (...x: unknown[]) => unknown)(...a) }));
vi.mock("../services/firebaseConfig", () => ({ firebaseConfig: { measurementId: "G-TEST" } }));

async function fresh() {
  vi.resetModules();
  const consent = await import("./consent");
  const analytics = await import("./analytics");
  return { ...consent, ...analytics };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "globalPrivacyControl", { value: undefined, configurable: true });
});

describe("consent", () => {
  it("is undecided until a choice is stored, and remembers it", async () => {
    const { readConsent, writeConsent } = await fresh();
    expect(readConsent()).toBeNull();
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
  });

  it("treats Global Privacy Control as a refusal, even after accepting", async () => {
    const { readConsent, writeConsent } = await fresh();
    writeConsent("granted");
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    expect(readConsent()).toBe("denied");
  });
});

describe("analytics", () => {
  it("loads nothing and sends nothing without consent", async () => {
    const { initAnalytics, track } = await fresh();
    initAnalytics();
    track({ name: "onboarding_complete", params: {} });
    await settle();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("starts when consent is granted and then sends events", async () => {
    const { initAnalytics, track, writeConsent } = await fresh();
    initAnalytics();
    writeConsent("granted");
    track({ name: "cta_click", params: { target: "app_store" } });
    await settle();
    await settle();
    expect(initializeApp).toHaveBeenCalledWith({ measurementId: "G-TEST" }, "analytics");
    expect(logEvent).toHaveBeenCalledWith({ id: "analytics" }, "cta_click", { target: "app_store" });
  });

  it("starts on load when consent was already given", async () => {
    localStorage.setItem("slate.analytics-consent", "granted");
    const { initAnalytics } = await fresh();
    initAnalytics();
    await settle();
    await settle();
    expect(initializeAnalytics).toHaveBeenCalled();
  });

  it("stops collecting when consent is withdrawn and sends nothing more", async () => {
    const { initAnalytics, track, writeConsent } = await fresh();
    initAnalytics();
    writeConsent("granted");
    await settle();
    await settle();
    writeConsent("denied");
    expect(setAnalyticsCollectionEnabled).toHaveBeenLastCalledWith({ id: "analytics" }, false);
    logEvent.mockClear();
    track({ name: "onboarding_complete", params: {} });
    await settle();
    expect(logEvent).not.toHaveBeenCalled();
  });
});
