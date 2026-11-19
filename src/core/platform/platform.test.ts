import { describe, expect, it } from "vitest";
import { detectPlatform, parseAttribution, withParams } from "./platform";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";

describe("detectPlatform", () => {
  it("recognises iPhone, Android and desktop", () => {
    expect(detectPlatform(IPHONE)).toBe("ios");
    expect(detectPlatform(ANDROID)).toBe("android");
    expect(detectPlatform(MAC)).toBe("desktop");
  });
  it("treats a touch-screen 'Macintosh' (iPadOS) as iOS", () => {
    expect(detectPlatform(MAC, 5)).toBe("ios");
  });
});

describe("parseAttribution", () => {
  it("maps src and from per the analytics spec", () => {
    expect(parseAttribution("?src=share&from=ios&c=profile_link")).toEqual({ source: "share", originPlatform: "ios", surface: "profile_link" });
    expect(parseAttribution("?src=store_badge").source).toBe("store_badge");
  });
  it("uses direct without src and other for unknown src", () => {
    expect(parseAttribution("").source).toBe("direct");
    expect(parseAttribution("?src=newsletter").source).toBe("other");
  });
  it("reports unknown for a missing or unrecognised from", () => {
    expect(parseAttribution("?src=share").originPlatform).toBe("unknown");
    expect(parseAttribution("?from=tv").originPlatform).toBe("unknown");
    expect(parseAttribution("?from=web").originPlatform).toBe("web");
  });
});

describe("withParams", () => {
  it("adds params and keeps existing ones", () => {
    expect(withParams("https://example.com/a?x=1", { src: "store_badge" })).toBe("https://example.com/a?x=1&src=store_badge");
  });
});
