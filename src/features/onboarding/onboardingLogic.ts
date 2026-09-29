// Pure onboarding rules, ported from OnboardingViewModel.swift and the step views so the
// behavior stays identical across platforms. No React or Firebase in here.
import type { OnboardingFields } from "../../core/services/firestore";
import { MAX_GENRES, MAX_LANGUAGES, RELEASE_OPTIONS, RUNTIME_OPTIONS, TOTAL_STEPS } from "./data";
import type { ReleasePreference, RuntimePreference } from "../../core/models/UserPreferences";

// iOS defaults (UserPreferences.swift) for anything missing on the document.
export const ONBOARDING_DEFAULTS: OnboardingFields = {
  preferredLanguages: [],
  topGenres: [],
  avoidGenres: [],
  releasePreference: "Mix of new and old",
  oldestAcceptableYear: 1970,
  storyPreference: "Mix of all",
  tonePreference: "Mix of both",
  pacingPreference: "Doesn't matter",
  runtimePreference: "Doesn't matter",
  maxSessionMinutes: 180,
  favoriteThemes: [],
};

export function draftFrom(preferences: Partial<OnboardingFields> | null): OnboardingFields {
  const merged = { ...ONBOARDING_DEFAULTS };
  if (!preferences) return merged;
  for (const key of Object.keys(ONBOARDING_DEFAULTS) as (keyof OnboardingFields)[]) {
    const value = preferences[key];
    if (value !== undefined && value !== null) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

// iOS resumes at max(1, onboardingStep); clamped so a finished/odd value can't leave the range.
export function clampStep(step: number | undefined): number {
  return Math.min(TOTAL_STEPS, Math.max(1, Math.trunc(step ?? 1) || 1));
}

// Step order follows OnboardingContent.swift: 1 languages, 2 favorite genres, 3 avoid genres,
// 4 release preference, 5 style & tone, 6 runtime, 7 themes.
export function canProceed(step: number, draft: OnboardingFields): boolean {
  switch (step) {
    case 1:
      return draft.preferredLanguages.length >= 1;
    case 2:
      return draft.topGenres.length >= 1 && draft.topGenres.length <= MAX_GENRES;
    default:
      return step >= 3 && step <= TOTAL_STEPS; // remaining steps are optional / always have a default
  }
}

export function toggleLanguage(codes: readonly string[], code: string): string[] {
  if (codes.includes(code)) return codes.filter((c) => c !== code);
  return codes.length < MAX_LANGUAGES ? [...codes, code] : [...codes];
}

// Favorites and avoided genres are mutually exclusive, each capped at 3 (steps 2 and 3).
export function toggleGenre(selected: readonly number[], id: number): number[] {
  if (selected.includes(id)) return selected.filter((g) => g !== id);
  return selected.length < MAX_GENRES ? [...selected, id] : [...selected];
}

export function toggleTheme(themes: readonly string[], theme: string): string[] {
  return themes.includes(theme) ? themes.filter((t) => t !== theme) : [...themes, theme];
}

// Step 4: New = current year - 15; Mix and Classics = 1970 (Step6_ReleasePreferenceView.swift).
export function oldestYearFor(release: ReleasePreference, currentYear = new Date().getFullYear()): number {
  return release === "Only new releases" ? currentYear - 15 : 1970;
}

export function applyRelease(draft: OnboardingFields, release: ReleasePreference): OnboardingFields {
  if (!RELEASE_OPTIONS.some((o) => o.value === release)) return draft;
  return { ...draft, releasePreference: release, oldestAcceptableYear: oldestYearFor(release) };
}

// Step 6 also sets maxSessionMinutes (Step9_RuntimePreferenceView.swift).
export function applyRuntime(draft: OnboardingFields, runtime: RuntimePreference): OnboardingFields {
  const option = RUNTIME_OPTIONS.find((o) => o.value === runtime);
  if (!option) return draft;
  return { ...draft, runtimePreference: runtime, maxSessionMinutes: option.maxSessionMinutes };
}
