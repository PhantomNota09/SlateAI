import { checkPassword } from "../../features/auth/validation";
import { CheckCircleIcon, CircleIcon } from "./icons";
import "./components.css";

const RULES = [
  ["minLength", "At least 8 characters"],
  ["uppercase", "One uppercase letter"],
  ["lowercase", "One lowercase letter"],
  ["number", "One number"],
] as const;

// Same four rules and 4-segment meter as iOS PasswordStrengthView.
export function PasswordStrength({ password }: { password: string }) {
  const result = checkPassword(password);
  const tone = result.isValid ? "good" : result.met >= 2 ? "fair" : "weak";

  return (
    <div className={`strength strength--${tone}`} aria-live="polite">
      <div className="strength__meter" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < result.met ? "is-filled" : undefined} />
        ))}
      </div>
      <ul className="strength__rules">
        {RULES.map(([key, label]) => (
          <li key={key} className={result[key] ? "is-met" : undefined}>
            {result[key] ? <CheckCircleIcon /> : <CircleIcon />}
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
