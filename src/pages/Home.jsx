import './Home.css';
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
