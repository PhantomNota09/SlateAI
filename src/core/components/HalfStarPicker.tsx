import { useState, type KeyboardEvent, type PointerEvent } from "react";
import "./components.css";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z";

function Star({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="stars__star">
      <svg viewBox="0 0 24 24" className="stars__outline" aria-hidden="true">
        <path d={STAR} />
      </svg>
      <svg viewBox="0 0 24 24" className="stars__fill" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} aria-hidden="true">
        <path d={STAR} />
      </svg>
    </span>
  );
}

// Half-star precision, 0.5–5.0 (iOS HalfStarRatingPicker). One slider for assistive tech:
// arrow keys move by half a star, pointer position picks the half.
export function HalfStarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  const valueAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return Math.min(5, Math.max(0.5, Math.ceil(ratio * 10) / 2));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 };
    if (e.key in step) {
      e.preventDefault();
      onChange(Math.min(5, Math.max(0.5, (value || 0) + step[e.key])));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0.5);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(5);
    }
  };

  return (
    <div
      className="stars"
      role="slider"
      tabIndex={0}
      data-autofocus
      aria-label="Your rating"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value || undefined}
      aria-valuetext={value ? `${value} out of 5 stars` : "No rating selected"}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => setHover(valueAt(e))}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => onChange(valueAt(e as unknown as PointerEvent<HTMLDivElement>))}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} fill={shown >= n ? 1 : shown >= n - 0.5 ? 0.5 : 0} />
      ))}
    </div>
  );
}
