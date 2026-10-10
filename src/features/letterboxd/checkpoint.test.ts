// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearCheckpoint, readCheckpoint, signatureOf, writeCheckpoint } from "./checkpoint";

beforeEach(() => localStorage.clear());

describe("checkpoint", () => {
  const sig = signatureOf("ratings.csv", 1234, 900);

  it("remembers progress for the same file and user only", () => {
    writeCheckpoint("u1", sig, 340);
    expect(readCheckpoint("u1", sig)).toBe(340);
    expect(readCheckpoint("u2", sig)).toBe(0);
    expect(readCheckpoint("u1", signatureOf("ratings.csv", 1234, 901))).toBe(0);
  });

  it("can be cleared and ignores corrupt data", () => {
    writeCheckpoint("u1", sig, 10);
    clearCheckpoint("u1");
    expect(readCheckpoint("u1", sig)).toBe(0);
    localStorage.setItem("slate.letterboxd-import.u1", "{nope");
    expect(readCheckpoint("u1", sig)).toBe(0);
  });
});
