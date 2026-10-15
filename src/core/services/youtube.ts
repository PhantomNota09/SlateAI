// Minimal typing and loader for YouTube's IFrame Player API (https://developers.google.com/youtube/iframe_api_reference).
// Only what the Discover hero uses.

export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

export interface YouTubePlayerOptions {
  videoId: string;
  host?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YouTubePlayer }) => void;
    onStateChange?: (e: { data: number; target: YouTubePlayer }) => void;
    onError?: (e: { data: number }) => void;
  };
}

export interface YouTubeApi {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
  PlayerState: { PLAYING: number };
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YouTubeApi> | null = null;

// Loads the API script once; resolves with the YT namespace. Rejects if the script is blocked
// (ad blockers, offline) so callers can fall back to a still image.
export function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT as YouTubeApi);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
