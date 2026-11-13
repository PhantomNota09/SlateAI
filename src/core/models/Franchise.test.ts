import { describe, expect, it } from "vitest";
import { franchiseProgress, parseFranchisePayload } from "./Franchise";

const part = (id: number) => ({ id, title: `Film ${id}`, overview: "", posterPath: "/p.jpg", backdropPath: null, releaseDate: "2001-01-01", voteAverage: 7 });

describe("parseFranchisePayload", () => {
  it("keeps valid franchises and drops malformed ones", () => {
    const payload = parseFranchisePayload({
      version: "v1",
      franchises: [
        { id: "mcu", displayName: "MCU", overview: "o", categories: ["Superhero", 3], posterPath: "/a", backdropPath: "", parts: [part(1), { title: "no id" }, part(2)] },
        { id: "empty", parts: [] },
        { displayName: "no id", parts: [part(3)] },
        null,
      ],
    });
    expect(payload?.version).toBe("v1");
    expect(payload?.franchises).toHaveLength(1);
    const f = payload!.franchises[0];
    expect(f.parts.map((p) => p.id)).toEqual([1, 2]);
    expect(f.categories).toEqual(["Superhero"]);
    expect(f.backdropPath).toBeNull();
  });

  it("rejects a response without a version or list", () => {
    expect(parseFranchisePayload({ franchises: [] })).toBeNull();
    expect(parseFranchisePayload({ version: "v", franchises: "x" })).toBeNull();
    expect(parseFranchisePayload(null)).toBeNull();
  });
});

describe("franchiseProgress", () => {
  it("counts only this franchise's films", () => {
    const f = parseFranchisePayload({ version: "v", franchises: [{ id: "a", parts: [part(1), part(2), part(3)] }] })!.franchises[0];
    expect(franchiseProgress(f, new Set([1, 3, 99]))).toEqual({ watched: 2, total: 3, percent: 67 });
  });
});
