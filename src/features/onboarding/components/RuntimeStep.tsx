import { OptionCard } from "../../../core/components/OptionCard";
import type { RuntimePreference } from "../../../core/models/UserPreferences";
import { RUNTIME_OPTIONS } from "../data";
import { StepFrame } from "./StepFrame";

const ICONS: Record<RuntimePreference, string> = {
  "~90 min": "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 1h6",
  "~2 hours": "M4 5h16v14H4zM4 9h16M8 5v14M16 5v14",
  "2.5+ hours": "M6 3h12M6 21h12M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9",
  "Doesn't matter": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.5 12.5 11 15l4.5-5",
};

export function RuntimeStep({
  value,
  onChange,
}: {
  value: RuntimePreference;
  onChange: (value: RuntimePreference) => void;
}) {
  return (
    <StepFrame title="Preferred movie runtime?" subtitle="How long do you typically like movies to be?">
      <div className="stack" role="radiogroup" aria-label="Runtime preference">
        {RUNTIME_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            name="runtime"
            title={o.title}
            description={o.description}
            checked={value === o.value}
            onSelect={() => onChange(o.value)}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONS[o.value]} />
              </svg>
            }
          />
        ))}
      </div>
    </StepFrame>
  );
}
