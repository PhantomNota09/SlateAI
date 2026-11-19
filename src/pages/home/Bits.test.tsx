// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const track = vi.fn();
vi.mock("../../core/analytics/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";

async function renderAs(ua: string) {
  vi.resetModules();
  Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
  const { StoreButtons } = await import("./Bits.jsx");
  return render(
    <MemoryRouter>
      <StoreButtons showQr />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StoreButtons", () => {
  it("sends iPhone users to the App Store with ?src and reports the click", async () => {
    await renderAs(IPHONE);
    const link = screen.getByRole("link", { name: /app store/i });
    expect(link.getAttribute("href")).toContain("apps.apple.com");
    expect(link.getAttribute("href")).toContain("src=store_badge");
    link.click();
    expect(track).toHaveBeenCalledWith({ name: "store_click", params: { store: "app_store", source: "direct" } });
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it("shows 'coming soon' on Android with no link and no store_click while Android is not live", async () => {
    await renderAs(ANDROID);
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it("shows the App Store badge, the Android label and a QR code on desktop", async () => {
    await renderAs(MAC);
    expect(screen.getByRole("link", { name: /app store/i })).toBeTruthy();
    expect(screen.getByText(/coming soon/i)).toBeTruthy();
    expect(screen.getByAltText(/scan to download/i)).toBeTruthy();
  });
});
