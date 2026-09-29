import "./components.css";

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="progress__fill" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
