// Runs before every build: fails if the copy now uses a character that one of
// the font subsets in fonts/ does not cover (it would render in a fallback
// font). The fix is `npm run fonts`, then commit the new files.

import { readFile } from "node:fs/promises";
import { charsFor, fonts } from "./fonts.mjs";

const manifest = JSON.parse(await readFile("fonts/subsets.json", "utf8"));
let missing = 0;

for (const font of fonts) {
  if (font.text !== "en" && font.text !== "ar") continue;
  const covered = new Set(manifest[font.out] ?? "");
  const needed = await charsFor(font.text);
  const gaps = [...needed].filter((c) => !covered.has(c));
  if (gaps.length) {
    missing++;
    console.error(`fonts/${font.out}.woff2 is missing: ${gaps.join(" ")}`);
  }
}

if (missing) {
  console.error("The copy changed. Run `npm run fonts` to remake the font subsets.");
  process.exit(1);
}
