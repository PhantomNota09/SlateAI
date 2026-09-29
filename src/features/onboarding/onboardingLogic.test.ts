import { describe, expect, it } from "vitest";
import {
  ONBOARDING_DEFAULTS,
  applyRelease,
  applyRuntime,
  canProceed,
  clampStep,
  draftFrom,
  oldestYearFor,
  toggleGenre,
  toggleLanguage,
  toggleTheme,
} from "./onboardingLogic";

describe("canProceed (mirrors OnboardingViewModel.canProceed)", () => {
  it("needs at least one language on step 1", () => {
    expect(canProceed(1, ONBOARDING_DEFAULTS)).toBe(false);
    expect(canProceed(1, { ...ONBOARDING_DEFAULTS, preferredLanguages: ["en"] })).toBe(true);
  });
  it("needs 1-3 favorite genres on step 2", () => {
    expect(canProceed(2, ONBOARDING_DEFAULTS)).toBe(false);
    expect(canProceed(2, { ...ONBOARDING_DEFAULTS, topGenres: [28] })).toBe(true);
    expect(canProceed(2, { ...ONBOARDING_DEFAULTS, topGenres: [1, 2, 3, 4] })).toBe(false);
  });
  it("lets steps 3-7 proceed without input", () => {
    for (const step of [3, 4, 5, 6, 7]) expect(canProceed(step, ONBOARDING_DEFAULTS)).toBe(true);
  });
});

describe("selection rules", () => {
  it("caps languages and genres at 3 and keeps order", () => {
    expect(toggleLanguage(["en", "hi", "te"], "fr")).toEqual(["en", "hi", "te"]);
    expect(toggleLanguage(["en"], "hi")).toEqual(["en", "hi"]);
    expect(toggleLanguage(["en", "hi"], "en")).toEqual(["hi"]);
    expect(toggleGenre([1, 2, 3], 4)).toEqual([1, 2, 3]);
    expect(toggleGenre([1, 2], 3)).toEqual([1, 2, 3]);
    expect(toggleGenre([1, 2, 3], 2)).toEqual([1, 3]);
  });
  it("themes have no cap", () => {
    expect(toggleTheme(["Heist"], "Revenge")).toEqual(["Heist", "Revenge"]);
    expect(toggleTheme(["Heist", "Revenge"], "Heist")).toEqual(["Revenge"]);
  });
});

describe("release and runtime side effects (match iOS)", () => {
  it("sets oldestAcceptableYear from the release choice", () => {
    expect(oldestYearFor("Only new releases", 2026)).toBe(2011);
    expect(oldestYearFor("Mix of new and old", 2026)).toBe(1970);
    expect(oldestYearFor("Love classics", 2026)).toBe(1970);
    expect(applyRelease(ONBOARDING_DEFAULTS, "Love classics")).toMatchObject({
      releasePreference: "Love classics",
      oldestAcceptableYear: 1970,
    });
  });
  it("sets maxSessionMinutes from the runtime choice", () => {
    const minutes = (r: Parameters<typeof applyRuntime>[1]) =>
      applyRuntime(ONBOARDING_DEFAULTS, r).maxSessionMinutes;
    expect(minutes("~90 min")).toBe(100);
    expect(minutes("~2 hours")).toBe(140);
    expect(minutes("2.5+ hours")).toBe(240);
    expect(minutes("Doesn't matter")).toBe(240);
  });
});

describe("draftFrom / clampStep", () => {
  it("fills gaps with iOS defaults and keeps stored values", () => {
    expect(draftFrom(null)).toEqual(ONBOARDING_DEFAULTS);
    expect(draftFrom({ topGenres: [28], favoriteThemes: undefined })).toMatchObject({
      topGenres: [28],
      favoriteThemes: [],
      tonePreference: "Mix of both",
    });
  });
  it("keeps the step within 1..7", () => {
    expect(clampStep(undefined)).toBe(1);
    expect(clampStep(0)).toBe(1);
    expect(clampStep(4)).toBe(4);
    expect(clampStep(99)).toBe(7);
  });
});
