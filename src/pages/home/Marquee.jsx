import { MARQUEE } from './data';

// A slow film-strip ribbon of the genres Slate asks about. Decorative.
export default function Marquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div className="lp-strip" aria-hidden="true">
      <div className="lp-strip__track">
        {row.map((g, i) => (
          <span key={`${g}-${i}`}>{g}</span>
        ))}
      </div>
    </div>
  );
}
