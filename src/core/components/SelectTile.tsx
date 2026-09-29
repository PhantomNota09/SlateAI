import type { InputHTMLAttributes } from "react";
import "./components.css";

// Multi-select tile (iOS GenreCard / ThemeCard). Checkbox underneath.
export function SelectTile({
  label,
  checked,
  disabled,
  onToggle,
  ...rest
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange" | "type" | "disabled">) {
  return (
    <label className={["tile", checked && "is-selected", disabled && "is-disabled"].filter(Boolean).join(" ")}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} {...rest} />
      <span>{label}</span>
    </label>
  );
}
