import { describe, expect, it } from "vitest";
import { describeCallableError } from "./callableErrors";

describe("describeCallableError", () => {
  it("maps `unavailable` to a retryable outage message", () => {
    expect(describeCallableError({ code: "functions/unavailable" })).toMatchObject({ kind: "unavailable" });
  });
  it("uses retryAfterSeconds for rate limiting (rounded up, singular/plural)", () => {
    expect(describeCallableError({ code: "functions/resource-exhausted", details: { retryAfterSeconds: 4.2 } })).toMatchObject({
      kind: "rate-limited", retryAfterSeconds: 5, message: expect.stringContaining("5 seconds"),
    });
    expect(describeCallableError({ code: "resource-exhausted", details: { retryAfterSeconds: 1 } }).message).toContain("1 second.");
  });
  it("copes with a missing or malformed retry delay", () => {
    for (const details of [undefined, {}, { retryAfterSeconds: "soon" }, { retryAfterSeconds: -3 }]) {
      const r = describeCallableError({ code: "functions/resource-exhausted", details });
      expect(r.kind).toBe("rate-limited");
      expect(r.retryAfterSeconds).toBeUndefined();
    }
  });
  it("falls back to a generic message for anything else", () => {
    for (const err of [new Error("x"), null, undefined, { code: 7 }, { code: "functions/internal" }]) {
      expect(describeCallableError(err).kind).toBe("other");
    }
    expect(describeCallableError({ code: "functions/unauthenticated" }).kind).toBe("unauthenticated");
  });
});
