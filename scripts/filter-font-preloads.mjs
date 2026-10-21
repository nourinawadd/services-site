import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

/**
 * next/font preloads every font on every page, because both languages share
 * the [lang] layout. This trims each language's pages to the fonts its first
 * screen needs; the others still load, without a preload, once text uses them.
 * Fonts are named by their CSS variable from lib/fonts.ts, with an optional
 * weight. If this script does not run, pages only get extra preloads.
 */
const preloads = {
  en: ["--font-geist", "--font-instrument"],
  ar: ["--font-plex-ar:400", "--font-amiri"],
};

const outDir = "out";

async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    }),
  );
  return nested.flat();
}

/** Every @font-face in the built CSS as { variable, weight range, file }. */
async function fontFaces() {
  const cssFiles = (await filesIn(join(outDir, "_next"))).filter((file) => file.endsWith(".css"));
  const css = (await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))).join("\n");

  const variableOf = new Map();
  for (const [, variable, family] of css.matchAll(/\{(--font-[\w-]+):\s*"([^"]+)"/g)) {
    variableOf.set(family, variable);
  }

  return [...css.matchAll(/@font-face\{([^}]*)\}/g)].flatMap(([, body]) => {
    const family = body.match(/font-family:\s*"?([^";]+)"?/)?.[1];
    const url = body.match(/url\(([^)]+)\)/)?.[1];
    if (!family || !url || !variableOf.has(family)) return [];
    const [min, max = min] = (body.match(/font-weight:\s*([\d ]+)/)?.[1] ?? "400")
      .trim()
      .split(/\s+/)
      .map(Number);
    return [{ variable: variableOf.get(family), min, max, file: basename(url) }];
  });
}

if (await stat(outDir).catch(() => null)) {
  const faces = await fontFaces();

  for (const [lang, wanted] of Object.entries(preloads)) {
    const keep = new Set();
    for (const entry of wanted) {
      const [variable, weight] = entry.split(":");
      const matches = faces.filter(
        (face) =>
          face.variable === variable &&
          (weight === undefined || (face.min <= Number(weight) && Number(weight) <= face.max)),
      );
      if (matches.length === 0) console.warn(`filter-font-preloads: no font matches ${entry}`);
      for (const face of matches) keep.add(face.file);
    }
    const kept = (href) => keep.has(basename(href));

    const dir = join(outDir, lang);
    if (!(await stat(dir).catch(() => null))) continue;
    let retained = 0;
    let removed = 0;
    for (const file of await filesIn(dir)) {
      if (!/\.(html|txt)$/.test(file)) continue;
      const before = await readFile(file, "utf8");
      // The <link> tags in the HTML, plus the matching hints in the RSC
      // payload (escaped inside the HTML, raw in .txt), which React would
      // otherwise turn back into preloads when the page hydrates.
      const after = before
        .replace(/<link rel="preload" href="([^"]+)" as="font"[^>]*\/>/g, (tag, href) =>
          kept(href) ? (retained++, tag) : (removed++, ""),
        )
        .replace(/:HL\[\\"([^\\"]+)\\",\\"font\\",\{[^}]*\}\]\\n/g, (row, href) =>
          kept(href) ? row : "",
        )
        .replace(/:HL\["([^"]+)","font",\{[^}]*\}\]\n/g, (row, href) => (kept(href) ? row : ""));
      if (after !== before) await writeFile(file, after);
    }
    console.log(`Font preloads on /${lang}/: kept ${retained}, removed ${removed}`);
  }
}
