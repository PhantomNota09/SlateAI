import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./components.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  children: ReactNode;
}

export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  const id = useId();
  return (
    <div className={["checkbox", className].filter(Boolean).join(" ")}>
      <input id={id} type="checkbox" {...rest} />
      <span className="checkbox__box" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <label htmlFor={id}>{children}</label>
    </div>
  );
}
