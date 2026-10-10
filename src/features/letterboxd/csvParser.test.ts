import { describe, expect, it } from "vitest";
import { CSVParseError, parseLetterboxdCSV, splitCSV } from "./csvParser";

const HEADER = "Date,Name,Year,Letterboxd URI,Rating";

describe("splitCSV", () => {
  it("handles quoted commas, escaped quotes, newlines inside quotes and CRLF", () => {
    expect(splitCSV('a,"b,c","say ""hi""","line1\nline2"\r\nd,e,f,g\r\n')).toEqual([
      ["a", "b,c", 'say "hi"', "line1\nline2"],
      ["d", "e", "f", "g"],
    ]);
  });
  it("ignores a BOM and blank lines", () => {
    expect(splitCSV("﻿x,y\n\n\nz,w")).toEqual([["x", "y"], ["z", "w"]]);
  });
});

describe("parseLetterboxdCSV", () => {
  it("parses entries with dates, years and half-star ratings", () => {
    const csv = `${HEADER}\n2021-03-01,"Parasite, (2019)",2019,https://boxd.it/a,4.5\n2020-01-15,Heat,1995,https://boxd.it/b,\n`;
    const [a, b] = parseLetterboxdCSV(csv);
    expect(a).toMatchObject({ title: "Parasite, (2019)", year: "2019", rating: 4.5, uri: "https://boxd.it/a" });
    expect(a.date?.toISOString()).toBe("2021-03-01T00:00:00.000Z");
    expect(b.rating).toBeNull();
  });

  it("drops invalid ratings and dates but keeps the film", () => {
    const [e] = parseLetterboxdCSV(`${HEADER}\nnot-a-date,Heat,1995,u,9\n`);
    expect(e.date).toBeNull();
    expect(e.rating).toBeNull();
  });

  it("skips rows without a title", () => {
    expect(parseLetterboxdCSV(`${HEADER}\n2020-01-01,,1999,u,3\n2020-01-02,Heat,1995,u,3\n`)).toHaveLength(1);
  });

  it("tells the user when they chose the wrong file", () => {
    expect(() => parseLetterboxdCSV("Date,Name,Year,Letterboxd URI\n2020-01-01,Heat,1995,u")).toThrow(/ratings\.csv/);
    expect(() => parseLetterboxdCSV("foo,bar\n1,2")).toThrow(CSVParseError);
  });

  it("rejects empty and header-only files", () => {
    expect(() => parseLetterboxdCSV("")).toThrow(CSVParseError);
    expect(() => parseLetterboxdCSV(HEADER)).toThrow(/No movies/);
  });

  it("finds columns by name, not position", () => {
    const [e] = parseLetterboxdCSV("Rating,Name,Year,Date,Letterboxd URI\n3.5,Heat,1995,2020-01-01,u");
    expect(e).toMatchObject({ title: "Heat", rating: 3.5, year: "1995" });
  });
});
