import { ALSO } from './data';
import { Reveal } from './useReveal';

export default function Also() {
  return (
    <section className="lp-section lp-section--tight" aria-labelledby="also-title">
      <div className="lp-wrap">
        <Reveal>
          <h2 id="also-title" className="lp-h3">Also in the credits</h2>
        </Reveal>
        <ul className="lp-also">
          {ALSO.map((a, i) => (
            <Reveal as="li" key={a.title} delay={i * 70} className="lp-also__item">
              <span className="lp-tag">{a.where}</span>
              <strong>{a.title}</strong>
              <p>{a.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
