// Parses Letterboxd's ratings.csv export (header: Date,Name,Year,Letterboxd URI,Rating).
// Port of LetterboxdCSVParser.swift, with quoted newlines and "" escapes handled properly.
export interface LetterboxdCSVEntry {
  date: Date | null; // when it was watched/rated
  title: string;
  year: string | null;
  uri: string;
  rating: number | null; // 0.5–5.0
}

export class CSVParseError extends Error {}

// Splits CSV text into rows of fields. Quoted fields may contain commas, newlines and "" quotes.
export function splitCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseRating(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 5 ? n : null;
}

export function parseLetterboxdCSV(text: string): LetterboxdCSVEntry[] {
  const rows = splitCSV(text);
  if (rows.length === 0) throw new CSVParseError("That file is empty.");

  // Reject the wrong export before importing thousands of unrated rows (watched.csv, films.csv…).
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasName = header.includes("name");
  const hasRating = header.includes("rating");
  if (!hasName || !hasRating) {
    throw new CSVParseError(
      hasName
        ? "This looks like watched.csv or watchlist.csv, which have no ratings. Choose ratings.csv from your Letterboxd export instead."
        : "That doesn't look like a Letterboxd export. Choose ratings.csv from your Letterboxd data export.",
    );
  }
  const col = (name: string) => header.indexOf(name);
  const [iDate, iName, iYear, iUri, iRating] = [col("date"), col("name"), col("year"), col("letterboxd uri"), col("rating")];

  const entries: LetterboxdCSVEntry[] = [];
  for (const row of rows.slice(1)) {
    const get = (i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");
    const title = get(iName);
    if (!title) continue;
    entries.push({
      date: parseDate(get(iDate)),
      title,
      year: get(iYear) || null,
      uri: get(iUri),
      rating: parseRating(get(iRating)),
    });
  }
  if (entries.length === 0) throw new CSVParseError("No movies were found in that file.");
  return entries;
}
