import "./components.css";

export function Divider({ children }: { children?: string }) {
  return (
    <div className="divider" role="separator">
      {children}
    </div>
  );
}
