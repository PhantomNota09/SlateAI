import { OptionCard } from "../../../core/components/OptionCard";
import type { ReleasePreference } from "../../../core/models/UserPreferences";
import { RELEASE_OPTIONS } from "../data";
import { StepFrame } from "./StepFrame";

export function ReleaseStep({
  value,
  onChange,
}: {
  value: ReleasePreference;
  onChange: (value: ReleasePreference) => void;
}) {
  return (
    <StepFrame title="Do you prefer new or classic movies?" subtitle="We'll prioritize your preference.">
      <div className="stack" role="radiogroup" aria-label="Release preference">
        {RELEASE_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            name="release"
            title={o.title}
            description={o.description}
            checked={value === o.value}
            onSelect={() => onChange(o.value)}
          />
        ))}
      </div>
    </StepFrame>
  );
}
