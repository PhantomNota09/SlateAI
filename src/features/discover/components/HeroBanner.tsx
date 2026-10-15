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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setPlaying(false);
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
          playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, loop: 1, playlist: videoKey },
          events: {
            onReady: (e) => {
              e.target.mute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            },
            onError: () => setPlaying(false), // embedding disabled etc.: stay on the still image
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
  }, [videoKey]);

  // Pause while the banner is scrolled out of view.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) player.current?.playVideo();
      else player.current?.pauseVideo();
    }, { threshold: 0.25 });
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
        <div className={`disc__hero-video${playing ? " is-playing" : ""}`} ref={mount} aria-hidden="true" />
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
        <Button onClick={() => onOpen(movie)}>View details</Button>
      </div>
    </section>
  );
}
