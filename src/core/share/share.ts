import { track, type ShareSurface } from "../analytics/analytics";
import { absoluteUrl } from "../config/site";

type ContentType = "stats" | "movie" | "badge" | "profile";

// <SITE_URL>/<path>?src=share&from=web&c=<surface> (ANALYTICS_SPEC "Link convention"). Nothing
// personal goes in the three params; a profile link's path carries the username as before.
export function buildShareLink(path: string, surface: ShareSurface): string {
  const url = new URL(absoluteUrl(path));
  url.searchParams.set("src", "share");
  url.searchParams.set("from", "web");
  url.searchParams.set("c", surface);
  return url.toString();
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

interface ShareInput {
  path: string;
  surface: ShareSurface;
  contentType: ContentType;
  title: string;
  text: string;
}

// Web Share API where the browser has it, otherwise copy the link. share_completed is only sent
// when the browser reports success: the share promise resolving, or the clipboard write working.
// Cancelling the share sheet sends nothing but share_created.
export async function shareLink({ path, surface, contentType, title, text }: ShareInput): Promise<ShareResult> {
  const url = buildShareLink(path, surface);
  track({ name: "share_created", params: { surface, content_type: contentType } });
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      track({ name: "share_completed", params: { surface, method: "native_sheet" } });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "cancelled";
      // Share sheet unavailable at runtime: fall through to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    track({ name: "share_completed", params: { surface, method: "copy_link" } });
    return "copied";
  } catch {
    return "failed";
  }
}
