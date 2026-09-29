import "./components.css";

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`brand brand--${size}`}>
      <img src="/logo.png" alt="" className="brand__logo" />
      <span className="brand__name">Slate AI</span>
    </span>
  );
}
