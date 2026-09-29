import "./components.css";

export function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  return <span className={`spinner spinner--${size}`} role="status" aria-label="Loading" />;
}
