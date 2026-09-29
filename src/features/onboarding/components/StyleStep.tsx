import { OptionCard } from "../../../core/components/OptionCard";
import type { PacingPreference, StoryPreference, TonePreference } from "../../../core/models/UserPreferences";
import { PACING_OPTIONS, STORY_OPTIONS, TONE_OPTIONS } from "../data";
import { StepFrame } from "./StepFrame";

function Group<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="group">
      <legend>{label}</legend>
      <div className="stack stack--tight">
        {options.map((option) => (
          <OptionCard key={option} compact name={name} title={option} checked={value === option} onSelect={() => onChange(option)} />
        ))}
      </div>
    </fieldset>
  );
}

export function StyleStep({
  story,
  tone,
  pacing,
  onStory,
  onTone,
  onPacing,
}: {
  story: StoryPreference;
  tone: TonePreference;
  pacing: PacingPreference;
  onStory: (v: StoryPreference) => void;
  onTone: (v: TonePreference) => void;
  onPacing: (v: PacingPreference) => void;
}) {
  return (
    <StepFrame title="What's your preferred style?" subtitle="Optional — helps us refine recommendations.">
      <div className="groups">
        <Group label="Story" name="story" options={STORY_OPTIONS} value={story} onChange={onStory} />
        <Group label="Tone" name="tone" options={TONE_OPTIONS} value={tone} onChange={onTone} />
        <Group label="Pacing" name="pacing" options={PACING_OPTIONS} value={pacing} onChange={onPacing} />
      </div>
    </StepFrame>
  );
}
