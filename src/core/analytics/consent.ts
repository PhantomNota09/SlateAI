// Analytics consent. Nothing is measured until the visitor says yes; the choice is kept in this
// browser only. "Global Privacy Control" (a browser-level opt-out signal) counts as a no.
export type Consent = "granted" | "denied";

const KEY = "slate.analytics-consent";
const CHANGE = "slate:consent-change";
export const OPEN_SETTINGS = "slate:consent-open";

export function privacySignalOptOut(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function readConsent(): Consent | null {
  if (privacySignalOptOut()) return "denied";
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Consent): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* private mode: the choice just won't persist */
  }
  window.dispatchEvent(new CustomEvent<Consent>(CHANGE, { detail: value }));
}

export function onConsentChange(listener: (value: Consent) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<Consent>).detail);
  window.addEventListener(CHANGE, handler);
  return () => window.removeEventListener(CHANGE, handler);
}

// Lets a footer link reopen the banner after a choice has been made.
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS));
}
