// Onboarding options and copy, from the iOS onboarding views (Features/Onboarding/Views)
// and spec §6. The `value` strings are the exact Firestore display strings — never re-case.
import type {
  PacingPreference,
  ReleasePreference,
  RuntimePreference,
  StoryPreference,
  TonePreference,
} from "../../core/models/UserPreferences";

export const TOTAL_STEPS = 7;
export const MAX_LANGUAGES = 3;
export const MAX_GENRES = 3;

export interface Language {
  code: string; // iso_639_1
  name: string; // english_name
  nativeName?: string;
}

// Fallback when the TMDb language list can't be loaded (same list iOS falls back to).
export const FALLBACK_LANGUAGES: readonly Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
];

export const POPULAR_THEMES = [
  "Time Travel",
  "Space Exploration",
  "Superhero",
  "Romance",
  "Family Drama",
  "Coming of Age",
  "Heist",
  "Survival",
  "Sports",
  "Music/Musical",
  "War",
  "Political",
  "Mind-Bending",
  "True Story",
  "Period Drama",
  "Revenge",
  "Road Trip",
  "Underdog Story",
  "Dystopian",
  "Artificial Intelligence",
] as const;

export interface ReleaseOption {
  value: ReleasePreference;
  title: string;
  description: string;
}

export const RELEASE_OPTIONS: readonly ReleaseOption[] = [
  { value: "Only new releases", title: "New Releases", description: "Movies from the last 15 years" },
  { value: "Mix of new and old", title: "Mix of Both", description: "From 1970 onwards" },
  { value: "Love classics", title: "Classic Films", description: "1970–2010 era" },
];

export interface RuntimeOption {
  value: RuntimePreference;
  title: string;
  description: string;
  maxSessionMinutes: number;
}

export const RUNTIME_OPTIONS: readonly RuntimeOption[] = [
  { value: "~90 min", title: "~90 minutes", description: "Short and sweet", maxSessionMinutes: 100 },
  { value: "~2 hours", title: "~2 hours", description: "Standard movie length", maxSessionMinutes: 140 },
  { value: "2.5+ hours", title: "2.5+ hours", description: "Epic, long movies", maxSessionMinutes: 240 },
  { value: "Doesn't matter", title: "Doesn't matter", description: "Any length is fine", maxSessionMinutes: 240 },
];

export const STORY_OPTIONS: readonly StoryPreference[] = [
  "Plot-driven",
  "Character-driven",
  "Visual spectacle",
  "Dialogue-heavy",
  "Mix of all",
];
export const TONE_OPTIONS: readonly TonePreference[] = ["Dark/Serious", "Light/Comedic", "Mix of both"];
export const PACING_OPTIONS: readonly PacingPreference[] = ["Slow-burn", "Fast-paced", "Doesn't matter"];
