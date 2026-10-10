import { describe, expect, it } from "vitest";
import { changedFields, draftProblem, preferencesDraftFrom } from "./preferencesLogic";

const base = () =>
  preferencesDraftFrom({
    preferredLanguages: ["en"],
    topGenres: [28],
    region: "gb",
    preferredStreamingServices: [8, 8, 337, -1],
  });

describe("preferencesDraftFrom", () => {
  it("normalizes region, drops invalid or repeated provider ids", () => {
    const d = base();
    expect(d.region).toBe("GB");
    expect(d.preferredStreamingServices).toEqual([8, 337]);
  });

  it("falls back to iOS defaults and US when fields are missing or malformed", () => {
    const d = preferencesDraftFrom({ region: "United States" });
    expect(d.region).toBe("US");
    expect(d.storyPreference).toBe("Mix of all");
    expect(d.preferredStreamingServices).toEqual([]);
  });
});

describe("changedFields", () => {
  it("is empty when nothing changed", () => {
    expect(changedFields(base(), base())).toEqual({});
  });

  it("includes only what changed", () => {
    const d = { ...base(), tonePreference: "Dark/Serious" as const, region: "US" };
    expect(changedFields(base(), d)).toEqual({ tonePreference: "Dark/Serious", region: "US" });
  });

  it("treats reordering a ranked list as a change", () => {
    const original = { ...base(), topGenres: [28, 35] };
    expect(changedFields(original, { ...original, topGenres: [35, 28] })).toEqual({ topGenres: [35, 28] });
  });
});

describe("draftProblem", () => {
  it("accepts a valid draft", () => expect(draftProblem(base())).toBeNull());
  it("requires a language", () => expect(draftProblem({ ...base(), preferredLanguages: [] })).toMatch(/language/));
  it("requires a favorite genre", () => expect(draftProblem({ ...base(), topGenres: [] })).toMatch(/genre/));
  it("caps favorite genres at three", () => expect(draftProblem({ ...base(), topGenres: [1, 2, 3, 4] })).toMatch(/up to 3/));
});
