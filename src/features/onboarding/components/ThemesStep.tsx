import { SelectTile } from "../../../core/components/SelectTile";
import { POPULAR_THEMES } from "../data";
import { toggleTheme } from "../onboardingLogic";
import { StepFrame } from "./StepFrame";

// iOS's copy says "Select at least 1" but its canProceed allows 0; this step is optional in
// practice, so the web copy says so plainly.
export function ThemesStep({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (themes: string[]) => void;
}) {
  return (
    <StepFrame
      title="What themes or topics do you love?"
      subtitle="Optional — pick as many as you like."
      status={<span className={selected.length > 0 ? "is-good" : undefined}>{selected.length} selected</span>}
    >
      <div className="grid grid--themes" role="group" aria-label="Themes">
        {POPULAR_THEMES.map((theme) => (
          <SelectTile
            key={theme}
            label={theme}
            checked={selected.includes(theme)}
            onToggle={() => onChange(toggleTheme(selected, theme))}
          />
        ))}
      </div>
    </StepFrame>
  );
}
