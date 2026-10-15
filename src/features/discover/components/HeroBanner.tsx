import { useEffect, useRef, useState } from "react";
import { Button } from "../../../core/components/Button";
import { backdropUrl, releaseYear, type Movie } from "../../../core/models/Movie";
import { loadYouTubeApi, type YouTubePlayer } from "../../../core/services/youtube";
import { useMovieDetail } from "../../recommendations/hooks/useMovieDetail";

const prefersReducedMotion = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Featured film (Netflix-style): the backdrop, with the trailer fading in over it, muted and
// looping, and a speaker button in the corner. If there's no trailer, the embed is blocked, or the
// visitor prefers reduced motion, the still backdrop is all that shows.
export function HeroBanner({ movie, region, onOpen }: { movie: Movie; region: string; onOpen: (m: Movie) => void }) {
  const image = backdropUrl(movie.backdropPath);
  const { detail } = useMovieDetail(movie.id, region);
  const videoKey = detail?.trailerKey ?? null;

  const root = useRef<HTMLElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const visible = useRef(false); // at least half the banner is on screen
  const finished = useRef(false); // the trailer ended or was stopped: it never plays again here
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [stopped, setStopped] = useState(false);

  // Ends playback for good: tears the player down and brings the still backdrop back.
  const stop = () => {
    finished.current = true;
    setStopped(true);
    setPlaying(false);
    player.current?.destroy();
    player.current = null;
  };

  useEffect(() => {
    finished.current = false;
    setPlaying(false);
    setStopped(false);
    setMuted(true);
    if (!videoKey || !mount.current || prefersReducedMotion()) return;
    let cancelled = false;
    const host = mount.current;
    // The API replaces the element it's given, so hand it a fresh child each time.
    const target = document.createElement("div");
    host.appendChild(target);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player.current = new YT.Player(target, {
          videoId: videoKey,
          host: "https://www.youtube-nocookie.com",
          // No autoplay flag and no loop: playback is started below, once the banner is on screen, and plays once.
          playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
          events: {
            onReady: (e) => {
              e.target.mute();
              if (visible.current) e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
              else if (e.data === YT.PlayerState.ENDED) stop();
            },
            onError: () => stop(), // embedding disabled etc.: stay on the still image
          },
        });
      })
      .catch(() => undefined); // script blocked: stay on the still image

    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey]);

  // YouTube's policy: only start once more than half the player is visible. Also pause while scrolled away.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      visible.current = true; // can't measure, so don't block the trailer
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.intersectionRatio >= 0.5;
        if (finished.current) return;
        if (visible.current) player.current?.playVideo();
        else if (entry.intersectionRatio < 0.25) player.current?.pauseVideo();
      },
      { threshold: [0, 0.25, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleMute = () => {
    if (!player.current) return;
    if (muted) player.current.unMute();
    else player.current.mute();
    setMuted(!muted);
  };

  return (
    <section className="disc__hero" aria-label="Featured" ref={root}>
      <div className="disc__hero-media">
        {image && <img src={image} alt="" />}
        <div className={`disc__hero-video${playing ? " is-playing" : ""}${stopped ? " is-stopped" : ""}`} ref={mount} aria-hidden="true" />
        <div className="disc__hero-scrim" />
        {playing && (
          <button type="button" className="disc__hero-mute" onClick={toggleMute} aria-label={muted ? "Unmute trailer" : "Mute trailer"} aria-pressed={!muted}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
              {muted ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
            </svg>
          </button>
        )}
      </div>
      <div className="disc__hero-body">
        <small>Featured this week</small>
        <h2>{movie.title}</h2>
        <p>{[releaseYear(movie.releaseDate), movie.voteAverage > 0 ? `★ ${movie.voteAverage.toFixed(1)}` : ""].filter(Boolean).join(" · ")}</p>
        <Button
          onClick={() => {
            stop(); // the video goes first, so the backdrop is back before the dialog opens
            onOpen(movie);
          }}
        >
          View details
        </Button>
      </div>
    </section>
  );
}
