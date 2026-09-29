/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The marketing site's stylesheets (App.css, index.css, pages/Legal.css) are global, so any
// class name reused by the /app UI would silently inherit their styles (this already
// happened with `.step` and `.hero`). This test fails if the two ever share a class name.
const SRC = fileURLToPath(new URL(".", import.meta.url));
const MARKETING = ["App.css", "index.css", "pages/Legal.css"].map((f) => join(SRC, f));

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

const classesIn = (file: string) =>
  new Set([...readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]));

describe("app CSS class names", () => {
  it("never collide with the marketing site's global CSS", () => {
    const marketing = new Set(MARKETING.flatMap((f) => [...classesIn(f)]));
    const collisions: string[] = [];
    for (const file of cssFiles(SRC).filter((f) => !MARKETING.includes(f))) {
      for (const cls of classesIn(file)) {
        if (marketing.has(cls)) collisions.push(`${file.replace(SRC, "src")}: .${cls}`);
      }
    }
    expect(collisions).toEqual([]);
  });
});
