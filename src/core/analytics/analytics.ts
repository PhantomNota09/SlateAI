import type { Analytics } from "firebase/analytics";
import { firebaseConfig } from "../services/firebaseConfig";
import { onConsentChange, readConsent } from "./consent";

// Product analytics (Google Analytics for Firebase, same project as iOS). Loaded lazily and
// only after consent, so visitors who decline — and the marketing pages' first paint — never
// download it. Events carry no personal data: no emails, user IDs, titles or movie IDs.
export type AnalyticsEvent =
  | { name: "sign_up"; params: { method: "email" | "google" } }
  | { name: "login"; params: { method: "email" | "google" } }
  | { name: "onboarding_step"; params: { step: number } }
  | { name: "onboarding_complete"; params: Record<string, never> }
  | { name: "recommendation_action"; params: { action: "watched" | "dismissed" | "watch_later" | "skipped" } }
  | { name: "watch_later_action"; params: { action: "watched" | "removed" } }
  | { name: "preferences_saved"; params: { fields_changed: number } }
  | { name: "cta_click"; params: { target: "app_store" | "web_app" } }
  | { name: "page_view"; params: { page_path: string } };

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
