// Device detection and link attribution (?src, ?from, ?c). Pure functions, so they are easy to test.
export type Platform = "ios" | "android" | "desktop";
export type LandingSource = "share" | "store_badge" | "direct" | "other";
export type OriginPlatform = "ios" | "android" | "web" | "unknown";

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS 13+ reports itself as a Mac; a touch screen tells them apart from real Macs.
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "desktop";
}

export function currentPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  return detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
}

export interface Attribution {
  source: LandingSource;
  originPlatform: OriginPlatform;
  surface: string | null;
}

const ORIGINS: OriginPlatform[] = ["ios", "android", "web"];

// src=share -> share, src=store_badge -> store_badge, no src -> direct, anything else -> other
// (ANALYTICS_SPEC section 3.1). `from` gives origin_platform; `c` is the share surface.
export function parseAttribution(search: string): Attribution {
  const params = new URLSearchParams(search);
  const src = params.get("src");
  const from = params.get("from");
  const source: LandingSource = !src ? "direct" : src === "share" ? "share" : src === "store_badge" ? "store_badge" : "other";
  const originPlatform = ORIGINS.includes(from as OriginPlatform) ? (from as OriginPlatform) : "unknown";
  return { source, originPlatform, surface: params.get("c") };
}

// Adds ?src=... (and any extra params) to a store or share URL without disturbing existing params.
export function withParams(url: string, params: Record<string, string>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}
