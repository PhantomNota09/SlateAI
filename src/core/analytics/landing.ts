import { parseAttribution, type Attribution } from "../platform/platform";
import { track } from "./analytics";
import { onConsentChange, readConsent } from "./consent";

let sent = false;
let entry: Attribution | null = null;

// How this visit began, captured on first load (the query string is gone after in-app navigation).
export function entryAttribution(): Attribution {
  return entry ?? parseAttribution(typeof location === "undefined" ? "" : location.search);
}

// One landing_view per page load, carrying where the visit came from (?src / ?from). If the
// visitor has not answered the consent banner yet, it is sent right after they accept; if they
// decline it is never sent.
export function reportLanding(search: string): void {
  if (sent) return;
  entry ??= parseAttribution(search);
  const send = () => {
    if (sent) return;
    sent = true;
    const { source, originPlatform } = parseAttribution(search);
    track({ name: "landing_view", params: { source, origin_platform: originPlatform } });
  };
  const consent = readConsent();
  if (consent === "granted") return send();
  if (consent === "denied") return;
  const off = onConsentChange((value) => {
    off();
    if (value === "granted") send();
  });
}

export function resetLandingForTests(): void {
  sent = false;
  entry = null;
}
