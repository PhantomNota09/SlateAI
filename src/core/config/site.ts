// Site-wide constants. Nothing else in the repo hardcodes the site URL or store links, so moving
// to a custom domain or launching on Google Play is a change in this file (or one env var).

// Swap for the custom domain later: set VITE_SITE_URL in Vercel, or edit the fallback. No trailing slash.
export const SITE_URL: string = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://slate-ai-nu.vercel.app").replace(/\/+$/, "");

export const APP_STORE_URL = "https://apps.apple.com/us/app/slate-ai/id6757089643";
export const APP_STORE_ID = "6757089643";

// Android is not published yet. While false, the Play badge is a non-link "coming soon" label and
// no Play store_click is ever sent. Turning it on needs PLAY_STORE_URL as well.
export const ANDROID_LIVE = false;
export const PLAY_STORE_URL: string | null = null;

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
