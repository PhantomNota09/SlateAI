import { StoreButtons, WebAppLink } from './Bits';
import { Reveal } from './useReveal';

export default function Finale() {
  return (
    <section className="lp-finale" aria-labelledby="finale-title">
      <div className="lp-finale__glow" aria-hidden="true" />
      <Reveal className="lp-wrap lp-center">
        <p className="lp-take">That’s a wrap</p>
        <h2 id="finale-title" className="lp-h1">
          Your next favorite movie
          <br />
          is one <em>pick</em> away.
        </h2>
        <div className="lp-cta-row">
          <StoreButtons showQr />
          <WebAppLink>Open the web app</WebAppLink>
        </div>
        <p className="lp-fine">Free · No ads · No subscriptions</p>
      </Reveal>
    </section>
  );
}
