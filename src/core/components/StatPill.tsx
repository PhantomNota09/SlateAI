import "./components.css";

// StatPill from the iOS component inventory: a big value over a small label.
export function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-pill">
      <strong className="stat-pill__value">{value}</strong>
      <span className="stat-pill__label">{label}</span>
    </div>
  );
}
