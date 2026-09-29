import type { ReactNode } from "react";
import "./components.css";

// Single-select card (iOS ReleaseCard / RuntimeCard / StyleOption). A real radio input
// underneath, so keyboard and screen-reader behavior come for free.
export function OptionCard({
  name,
  title,
  description,
  icon,
  checked,
  onSelect,
  compact,
}: {
  name: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  checked: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <label className={["option", checked && "is-selected", compact && "option--compact"].filter(Boolean).join(" ")}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      {icon && <span className="option__icon">{icon}</span>}
      <span className="option__text">
        <span className="option__title">{title}</span>
        {description && <span className="option__desc">{description}</span>}
      </span>
      <span className="option__radio" aria-hidden="true" />
    </label>
  );
}
