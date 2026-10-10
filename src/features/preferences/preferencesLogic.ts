// Pure rules for the Preferences page: the editable draft, which fields changed, and whether
// it can be saved. No React or Firebase in here.
import type { OnboardingFields } from "../../core/services/firestore";
import type { UserPreferences } from "../../core/models/UserPreferences";
import { draftFrom } from "../onboarding/onboardingLogic";
import { MAX_GENRES } from "../onboarding/data";

export interface PreferencesDraft extends OnboardingFields {
  region: string;
  preferredStreamingServices: number[];
}

export const DEFAULT_REGION = "US";

export function preferencesDraftFrom(prefs: Partial<UserPreferences> | null): PreferencesDraft {
  const region = typeof prefs?.region === "string" && /^[A-Za-z]{2}$/.test(prefs.region) ? prefs.region.toUpperCase() : DEFAULT_REGION;
  const services = (prefs?.preferredStreamingServices ?? []).filter((id) => Number.isInteger(id) && id > 0);
  return { ...draftFrom(prefs), region, preferredStreamingServices: [...new Set(services)] };
}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Only fields that differ from what was loaded. Order inside arrays matters (languages and
// genres are ranked), so a reorder counts as a change.
export function changedFields(original: PreferencesDraft, draft: PreferencesDraft): Partial<PreferencesDraft> {
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(draft) as (keyof PreferencesDraft)[]) {
    if (!sameValue(original[key], draft[key])) changes[key] = draft[key];
  }
  return changes as Partial<PreferencesDraft>;
}

// The same minimums onboarding enforces: at least one language and 1–3 favorite genres.
export function draftProblem(draft: PreferencesDraft): string | null {
  if (draft.preferredLanguages.length < 1) return "Choose at least one language.";
  if (draft.topGenres.length < 1) return "Choose at least one favorite genre.";
  if (draft.topGenres.length > MAX_GENRES) return `Choose up to ${MAX_GENRES} favorite genres.`;
  return null;
}
