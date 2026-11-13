import { describe, expect, it } from "vitest";
import { filterProviders } from "./providerSearch";

const p = (id: number, name: string) => ({ id, name, logoPath: null });
const list = [p(8, "Netflix"), p(9, "Amazon Prime Video"), p(337, "Disney Plus"), p(381, "Canal+"), p(11, "MUBI"), p(2, "Apple TV"), p(350, "Apple TV Plus")];

describe("filterProviders", () => {
  it("returns everything for an empty or blank query", () => {
    expect(filterProviders(list, "")).toHaveLength(list.length);
    expect(filterProviders(list, "   ")).toHaveLength(list.length);
  });

  it("matches part of a name, ignoring case", () => {
    expect(filterProviders(list, "NETF").map((x) => x.id)).toEqual([8]);
  });

  it("needs every word, in any order", () => {
    expect(filterProviders(list, "video prime").map((x) => x.id)).toEqual([9]);
    expect(filterProviders(list, "apple").map((x) => x.id)).toEqual([2, 350]);
  });

  it("ignores accents and keeps punctuation searchable", () => {
    expect(filterProviders([p(1, "Crunchyroll"), p(2, "Café TV")], "cafe").map((x) => x.id)).toEqual([2]);
    expect(filterProviders(list, "canal+").map((x) => x.id)).toEqual([381]);
  });

  it("returns nothing when nothing matches, and keeps the original order", () => {
    expect(filterProviders(list, "zzz")).toEqual([]);
    expect(filterProviders(list, "plus").map((x) => x.id)).toEqual([337, 350]);
  });
});
