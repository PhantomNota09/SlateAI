import { useEffect } from 'react';
import './Home.css';
import { APP_STORE_ID, absoluteUrl } from '../core/config/site';
import { useDocumentMeta } from '../core/hooks/useDocumentMeta';
import Nav from './home/Nav';
import Hero from './home/Hero';
import Marquee from './home/Marquee';
import TasteDemo from './home/TasteDemo';
import WhyBoard from './home/WhyBoard';
import Dismiss from './home/Dismiss';
import Streaks from './home/Streaks';
import Everywhere from './home/Everywhere';
import Also from './home/Also';
import Finale from './home/Finale';
import Footer from './home/Footer';

// Marketing home page. The concept: Slate is a clapperboard, so the page is a shoot. Each section
// is a "take" and most are small interactive demos instead of feature cards.
export default function Home() {
  useDocumentMeta({
    title: 'Slate - Your Perfect Movie Match, Every Time',
    description: 'Stop wasting time scrolling. AI-powered movie recommendations that actually match your taste. Get your top 10 personalized picks instantly.',
    path: '/',
  });
  // iOS Smart App Banner: Safari shows an "Open / Get" bar for the app. Home page only.
  useEffect(() => {
    const el = document.createElement('meta');
    el.name = 'apple-itunes-app';
    el.content = `app-id=${APP_STORE_ID}, app-argument=${absoluteUrl('/')}`;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return (
    <div className="lp">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <TasteDemo />
        <WhyBoard />
        <Dismiss />
        <Streaks />
        <Everywhere />
        <Also />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}
