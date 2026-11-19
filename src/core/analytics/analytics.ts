import type { Analytics } from "firebase/analytics";
import { firebaseConfig } from "../services/firebaseConfig";
import { onConsentChange, readConsent } from "./consent";

// Product analytics (Google Analytics for Firebase, same project as iOS). Loaded lazily and
// only after consent, so visitors who decline — and the marketing pages' first paint — never
// download it. Events carry no personal data: no emails, user IDs, titles or movie IDs.
export type MatchBucket = "0-39" | "40-59" | "60-79" | "80-100" | "none";
export type LandingSourceParam = "share" | "store_badge" | "direct" | "other";
export type OriginPlatformParam = "ios" | "android" | "web" | "unknown";
export type ShareSurface = "share_card" | "profile_link" | "milestone" | "invite";

// Names and values follow docs/ANALYTICS_SPEC.md in the backend repo (sections 2, 3, 3.1).
export type AnalyticsEvent =
  | { name: "sign_up"; params: { method: "email" | "google" } }
  | { name: "login"; params: { method: "email" | "google" } }
  | { name: "onboarding_step"; params: { step_index: number } }
  | { name: "onboarding_complete"; params: Record<string, never> }
  | {
      name: "card_action";
      params: { action: "rated" | "dismissed" | "watch_later" | "skipped"; movie_id: number; match_bucket: MatchBucket; rating?: number; dismiss_reason?: string };
    }
  | { name: "preferences_updated"; params: { fields_changed: number } }
  | { name: "landing_view"; params: { source: LandingSourceParam; origin_platform: OriginPlatformParam } }
  | { name: "store_click"; params: { store: "app_store" | "play_store"; source: LandingSourceParam } }
  | { name: "profile_viewed_from_link"; params: { origin_platform: OriginPlatformParam } }
  | { name: "share_created"; params: { surface: ShareSurface; content_type: "stats" | "movie" | "badge" | "profile" } }
  | { name: "share_completed"; params: { surface: ShareSurface; method: "native_sheet" | "copy_link" | "save_image" } };

// match_bucket from the server's matchPercentage (spec section 2); "none" when there is no score.
export function matchBucket(pct: number | null | undefined): MatchBucket {
  if (pct == null || Number.isNaN(pct)) return "none";
  if (pct < 40) return "0-39";
  if (pct < 60) return "40-59";
  if (pct < 80) return "60-79";
  return "80-100";
}

type Module = typeof import("firebase/analytics");

let loading: Promise<{ mod: Module; analytics: Analytics } | null> | null = null;
let active: { mod: Module; analytics: Analytics } | null = null;

async function start(): Promise<void> {
  if (loading || !firebaseConfig.measurementId) return;
  loading = (async () => {
    try {
      const [mod, { initializeApp }] = await Promise.all([import("firebase/analytics"), import("firebase/app")]);
      if (!(await mod.isSupported())) return null;
      // A separate, named app: only analytics lives in it, so marketing pages don't pull in auth/firestore.
      const app = initializeApp(firebaseConfig, "analytics");
      const analytics = mod.initializeAnalytics(app, { config: { send_page_view: false } });
      mod.setAnalyticsCollectionEnabled(analytics, true);
      active = { mod, analytics };
      return active;
    } catch (err) {
      console.warn("Analytics unavailable", err);
      return null;
    }
  })();
  await loading;
}

function stop(): void {
  if (active) active.mod.setAnalyticsCollectionEnabled(active.analytics, false);
}

// Call once at startup. Starts measuring if consent was already given, and follows later changes.
export function initAnalytics(): void {
  if (readConsent() === "granted") void start();
  onConsentChange((value) => {
    if (value === "granted") {
      if (active) active.mod.setAnalyticsCollectionEnabled(active.analytics, true);
      else void start();
    } else stop();
  });
}

export function track(event: AnalyticsEvent): void {
  if (readConsent() !== "granted") return;
  void (loading ?? Promise.resolve(null)).then((ready) => {
    // firebase's logEvent is overloaded per standard event name; ours are custom names.
    if (ready) (ready.mod.logEvent as (a: Analytics, name: string, params?: Record<string, unknown>) => void)(ready.analytics, event.name, event.params);
  });
}
