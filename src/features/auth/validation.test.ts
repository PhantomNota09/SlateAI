import { describe, expect, it } from "vitest";
import { checkPassword, isValidEmail, usernameIssue } from "./validation";

describe("isValidEmail", () => {
  it.each(["a@bb.co", "first.last+tag@mail.example.com"])("accepts %s", (e) => {
    expect(isValidEmail(e)).toBe(true);
  });
  it.each(["", "a@b", "a@b.co", "a@bb.c", "@b.com", "a@@b.com", "a b@c.com", "a@x.c1"])("rejects %s", (e) => {
    expect(isValidEmail(e)).toBe(false);
  });
});

describe("checkPassword (iOS policy)", () => {
  it("requires 8+ chars, upper, lower and a number", () => {
    expect(checkPassword("Passw0rd").isValid).toBe(true);
    expect(checkPassword("password1").uppercase).toBe(false);
    expect(checkPassword("PASSWORD1").lowercase).toBe(false);
    expect(checkPassword("Password").number).toBe(false);
    expect(checkPassword("Pa1").minLength).toBe(false);
  });
  it("counts met rules", () => {
    expect(checkPassword("").met).toBe(0);
    expect(checkPassword("Passw0rd").met).toBe(4);
  });
});

describe("usernameIssue", () => {
  it("flags short and invalid usernames", () => {
    expect(usernameIssue("ab")).toBe("too-short");
    expect(usernameIssue("bad name")).toBe("invalid-chars");
    expect(usernameIssue("good_name1")).toBeNull();
  });
});
