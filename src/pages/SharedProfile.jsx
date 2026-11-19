import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './Home.css';
import { track } from '../core/analytics/analytics';
import { useDocumentMeta } from '../core/hooks/useDocumentMeta';
import { parseAttribution } from '../core/platform/platform';
import { StoreButtons } from './home/Bits';

// Landing page for a shared profile link (/u/<username>?src=share&from=ios&c=profile_link).
// Opens in the iOS app when installed (universal link); otherwise this is what people see.
// It shows the username from the link only, with no profile data and no sign-in, so nothing here
// needs backend access. The src/from/c params stay on the URL, so attribution survives.
export default function SharedProfile() {
  const { username = '' } = useParams();
  const { search } = useLocation();
  useDocumentMeta({
    title: `@${username} on Slate`,
    description: `${username} shares their movie taste on Slate. Get personalized picks that learn what you like.`,
    path: `/u/${encodeURIComponent(username)}`,
    noindex: true,
  });
  useEffect(() => {
    track({ name: 'profile_viewed_from_link', params: { origin_platform: parseAttribution(search).originPlatform } });
  }, [search]);

  return (
    <div className="lp">
      <main className="lp-wrap" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 0' }}>
        <div>
          <img src="/logo.png" alt="" width="48" height="50" />
          <h1>@{username} is on Slate</h1>
          <p>Slate learns your taste and picks movies you will actually love. Get the app to see their profile and add them as a friend.</p>
          <StoreButtons showQr />
          <p>
            <Link to="/">What is Slate?</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
