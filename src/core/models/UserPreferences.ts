// Mirrors `UserPreferences.CodingKeys` (Slate/Core/Models/UserPreferences.swift) and
// spec §2 / §6 exactly. Field names and enum values are the cross-platform contract —
// never rename for JS convention or re-case an enum string.

export type StoryPreference =
  | "Plot-driven"
  | "Character-driven"
  | "Visual spectacle"
  | "Dialogue-heavy"
  | "Mix of all";

export type TonePreference = "Dark/Serious" | "Light/Comedic" | "Mix of both";

export type PacingPreference = "Slow-burn" | "Fast-paced" | "Doesn't matter";

export type WatchingWith = "Alone" | "With partner" | "With family" | "With friends";

export type ReleasePreference = "Only new releases" | "Mix of new and old" | "Love classics";

export type ForeignFilmPreference = "Actively seek" | "Open to" | "Rarely watch";

export type RuntimePreference = "~90 min" | "~2 hours" | "2.5+ hours" | "Doesn't matter";

// iOS `SubtitleType` (deprecated) and `AttentionLevel` raw values. Not asked in onboarding,
// but iOS decodes them strictly, so they must always hold a valid value.
export type SubtitlePreference = "Love them" | "Don't mind" | "Prefer dubbed" | "Avoid foreign films";

export type AttentionLevel = "Full focus" | "Background watching" | "Multitasking";

export type WatchTime = "Weekday evenings" | "Weekend binges" | "Late night" | "During meals";

export type CaresAbout =
  | "Awards/Nominations"
  | "Box office success"
  | "Cult classics"
  | "Hidden gems";

export type RatedSentiment = "loved" | "liked" | "meh" | "disliked" | "notSeen";

export type DismissalReason =
  | "Already watched it"
  | "Not interested in this genre"
  | "Not in the mood for this"
  | "Too long"
  | "Too short"
  | "Too much violence"
  | "Too mature/explicit"
  | "Looks boring"
  | "Reviews are bad"
  | "Too old"
  | "Other (specify)";

export interface RatedMovie {
  id: number;
  title: string;
  posterPath: string | null;
  sentiment: RatedSentiment;
}

export interface MovieComparison {
  movieA: number;
  movieB: number;
  preferred: number;
}

// The `users/{uid}` document. iOS decodes every enum-like field strictly
// (`decodeIfPresent(Enum.self…)` throws on an unknown raw value, including ""), so these
// fields must ALWAYS hold a valid spec §6 display string — signup writes iOS's defaults
// and onboarding overwrites them with the user's choices. Never write "".
export interface UserPreferences {
  name: string;
  email: string;
  username: string;
  avatarURL: string;

  topGenres: number[];
  avoidGenres: number[];

  storyPreference: StoryPreference;
  tonePreference: TonePreference;
  pacingPreference: PacingPreference;

  favoriteThemes: string[];

  maxViolenceLevel: number;
  maxSexualContent: number;

  preferredRatings: string[];

  /** @deprecated superseded by foreignFilmPreference */
  subtitlePreference: SubtitlePreference;

  watchingTimes: WatchTime[];
  maxSessionMinutes: number;
  watchingWith: WatchingWith;
  attentionLevel: AttentionLevel;

  rottenTomatoesThreshold: number;
  imdbThreshold: number;
  trustedReviewers: string[];

  caresAbout: CaresAbout[];
  releasePreference: ReleasePreference;
  oldestAcceptableYear?: number;
  foreignFilmPreference: ForeignFilmPreference;

  preferredLanguages: string[];

  ratedMovies: RatedMovie[];
  /** @deprecated legacy, not used by scoring */
  movieComparisons: MovieComparison[];

  favoriteActors: string[];
  favoriteDirectors: string[];
  guiltyPleasures: string[];
  specificAvoidances: string[];
  antiPatterns: string[];

  /** @deprecated legacy */
  topRecommendations: number[];

  // NOTE: `watchedRecommendations`, `dismissedRecommendations`, and
  // `watchLaterMovieIds` are intentionally NOT modeled here — they're deprecated
  // pre-migration array fields on this doc, superseded by the
  // users/{uid}/watchedRecommendations, .../dismissedRecommendations, and
  // .../watchLater subcollections. Never write them.

  collectionWatchedMovies: number[];

  runtimePreference: RuntimePreference;
  rewatchBehavior: boolean;

  isOnboarded: boolean;
  onboardingStep: number;
  hasCompletedTutorial: boolean;
  hasCompletedProfile: boolean;

  letterboxdUsername?: string;
  letterboxdImportSource?: string;
  letterboxdFullImportDate?: unknown; // Firestore Timestamp (iOS writes a Date)
  letterboxdLastRSSSync?: unknown; // Firestore Timestamp
  letterboxdTotalMoviesImported?: number;

  region: string;

  preferredStreamingServices: number[];
  streamingAvailabilityTypes: string[];
}

// Fields set at signup, before onboarding has run. The Letterboxd fields are omitted
// entirely (iOS decodes them with defaults when absent) since the Letterboxd import flow
// sets them later.
export type NewUserPreferences = Omit<
  UserPreferences,
  | "letterboxdUsername"
  | "letterboxdImportSource"
  | "letterboxdFullImportDate"
  | "letterboxdLastRSSSync"
  | "letterboxdTotalMoviesImported"
>;
