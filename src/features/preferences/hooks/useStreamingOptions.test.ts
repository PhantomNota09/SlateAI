import { describe, expect, it } from "vitest";
import { parseProviders, parseRegions } from "./useStreamingOptions";

describe("parseRegions", () => {
  it("keeps valid regions sorted by name and ignores junk", () => {
    const raw = { results: [{ iso_3166_1: "US", english_name: "United States" }, { iso_3166_1: "xx1", english_name: "Bad" }, { iso_3166_1: "AU", english_name: "Australia" }, null] };
    expect(parseRegions(raw)).toEqual([{ code: "AU", name: "Australia" }, { code: "US", name: "United States" }]);
  });
  it("returns an empty list for unexpected payloads", () => {
    expect(parseRegions(undefined)).toEqual([]);
    expect(parseRegions({ results: "no" })).toEqual([]);
  });
});

describe("parseProviders", () => {
  it("orders by the region's display priority", () => {
    const raw = {
      results: [
        { provider_id: 2, provider_name: "B", logo_path: "/b.png", display_priorities: { US: 5 } },
        { provider_id: 1, provider_name: "A", logo_path: "/a.png", display_priorities: { US: 1 } },
        { provider_id: 3, provider_name: "C" },
      ],
    };
    expect(parseProviders(raw, "US").map((p) => p.id)).toEqual([1, 2, 3]);
    expect(parseProviders(raw, "US")[2].logoPath).toBeNull();
  });
  it("drops entries without a numeric id", () => {
    expect(parseProviders({ results: [{ provider_id: "x", provider_name: "A" }] }, "US")).toEqual([]);
  });
});
