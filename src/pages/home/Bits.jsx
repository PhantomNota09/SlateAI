import { useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../../core/analytics/analytics';
import { entryAttribution } from '../../core/analytics/landing';
import { ANDROID_LIVE, APP_STORE_URL, PLAY_STORE_URL } from '../../core/config/site';
import { currentPlatform, withParams } from '../../core/platform/platform';
import { TMDB_IMG } from '../../shared/demoFilms';

export function AppStoreBadge({ className = '' }) {
  return (
    <a href={withParams(APP_STORE_URL, { src: 'store_badge' })} className={`lp-appstore ${className}`} target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" onClick={() => track({ name: 'store_click', params: { store: 'app_store', source: entryAttribution().source } })}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <span>
        <small>Download on the</small>
        <strong>App Store</strong>
      </span>
    </a>
  );
}

function PlayStoreBadge({ className = '' }) {
  if (!ANDROID_LIVE || !PLAY_STORE_URL) {
    return <span className={`lp-appstore lp-appstore--soon ${className}`} role="note"><span><small>Android</small><strong>Coming soon</strong></span></span>;
  }
  return (
    <a href={withParams(PLAY_STORE_URL, { src: 'store_badge' })} className={`lp-appstore ${className}`} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" onClick={() => track({ name: 'store_click', params: { store: 'play_store', source: entryAttribution().source } })}>
      <span><small>Get it on</small><strong>Google Play</strong></span>
    </a>
  );
}

// Device-aware store buttons: iOS gets the App Store, Android the Play badge (or "coming soon"
// while ANDROID_LIVE is off), desktop gets both plus a QR code for the phone.
export function StoreButtons({ className = '', showQr = false }) {
  const platform = currentPlatform();
  return (
    <div className="lp-stores">
      {platform !== 'android' && <AppStoreBadge className={className} />}
      {platform !== 'ios' && <PlayStoreBadge className={className} />}
      {showQr && platform === 'desktop' && (
        <img className="lp-qr" src="/qr-app-store.svg" alt="Scan to download Slate on the App Store" width="96" height="96" loading="lazy" />
      )}
    </div>
  );
}

export function WebAppLink({ children = 'Use it on the web', className = '' }) {
  return (
    <Link to="/app/sign-up" className={`lp-weblink ${className}`}>
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

// Real poster from TMDB's CDN over a gradient fallback (shown while loading, or if the image
// fails). Posters are illustrative and credited in the page footer.
export function PosterArt({ film, size = 'md', eager = false }) {
  const [failed, setFailed] = useState(false);
  const px = size === 'sm' ? 'w185' : 'w342';
  const showFallback = !film.poster || failed;
  return (
    <div
      className={`lp-poster lp-poster--${size} ${showFallback ? 'is-fallback' : ''}`}
      style={{ '--h1': film.hues[0], '--h2': film.hues[1] }}
      aria-hidden="true"
    >
      {film.poster && !failed && (
        <img
          className="lp-poster__img"
          src={`${TMDB_IMG}/${px}${film.poster}`}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {showFallback && (
        <>
          <span className="lp-poster__orb" />
          <span className="lp-poster__title">{film.title}</span>
        </>
      )}
    </div>
  );
}

export function MatchRing({ value, size = 56 }) {
  return (
    <span className="lp-ring" style={{ '--pct': `${value}%`, '--size': `${size}px` }} role="img" aria-label={`${value}% match`}>
      <span>
        {value}
        <small>%</small>
      </span>
    </span>
  );
}

export const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
