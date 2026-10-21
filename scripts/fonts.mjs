// Makes the self-hosted font subsets in fonts/ (WOFF2). Dev only; the outputs
// are committed. Needs Python with fontTools.
//
//   npm run fonts
//
// The display, script and handwriting faces are used for a few words each, but
// Google's files carry whole alphabets (and spaces between Arabic words pull in
// their Latin files too). This cuts each one down to the characters the copy
// actually uses, keeping every OpenType feature so Arabic still joins and
// shapes correctly. fonts/subsets.json records what each file covers;
// scripts/check-fonts.mjs fails the build if the copy later needs a character
// a subset is missing, so the fix is always just to run this again.

import { execFileSync } from "node:child_process";
import { compress } from "wawoff2";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const GOOGLE = "https://github.com/google/fonts/raw/main/ofl";
const srcDir = "recordings/fonts-src"; // downloads stay in their own gitignored folder

/**
 * text: "en" or "ar" takes the characters of that language's copy (see
 * charsFor), or a fixed string. axes pins a variable font to one instance.
 */
export const fonts = [
  {
    out: "bricolage-800-75",
    src: `${GOOGLE}/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf`,
    axes: { wght: 800, wdth: 75, opsz: 72 },
    // Only ever uppercased, so capitals, digits and punctuation are enough.
    text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?'’\"-–&+()/",
  },
  { out: "pinyon-script", src: `${GOOGLE}/pinyonscript/PinyonScript-Regular.ttf`, text: "en" },
  { out: "reenie-beanie", src: `${GOOGLE}/reeniebeanie/ReenieBeanie.ttf`, text: "en" },
  { out: "amiri-700", src: `${GOOGLE}/amiri/Amiri-Bold.ttf`, text: "ar" },
  { out: "aref-ruqaa-700", src: `${GOOGLE}/arefruqaa/ArefRuqaa-Bold.ttf`, text: "ar" },
  { out: "lalezar", src: `${GOOGLE}/lalezar/Lalezar-Regular.ttf`, text: "ar" },
  {
    out: "playpen-sans-arabic-400",
    src: `${GOOGLE}/playpensansarabic/PlaypenSansArabic%5Bwght%5D.ttf`,
    axes: { wght: 400 },
    text: "ar",
  },
];

const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");

/**
 * Every character a language's copy can show, read from its content file, the
 * package data and the config. English: those plus all printable ASCII.
 * Arabic: every non-ASCII character plus ASCII without the lowercase letters,
 * which the Arabic faces never set (Latin bits on /ar use Geist Mono or Plex;
 * capitals stay for "PDF").
 */
export async function charsFor(lang) {
  const files = [`content/${lang}.ts`, "data/packages.json", "site.config.ts"];
  let text = (await Promise.all(files.map((f) => readFile(f, "utf8")))).join("") + ascii;
  if (lang === "ar") text = text.replace(/[a-z]/g, "");
  return [...new Set(text.replace(/\s/g, " "))].sort().join("");
}

/**
 * The OpenType features text needs to come out right: Arabic joining forms,
 * marks, required and standard ligatures, contextual forms and kerning.
 * Stylistic sets and swash alternates are left out; keeping them pulls in
 * hundreds of glyphs nothing on the page uses.
 */
const features = ["ccmp", "locl", "isol", "init", "medi", "fina", "rlig", "liga", "calt", "rclt", "curs", "kern", "mark", "mkmk"];

const exists = (path) => stat(path).then(() => true, () => false);

const python = `
import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
src, out, text, axes, features = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4]), json.loads(sys.argv[5])
font = TTFont(src)
if axes:
    font = instancer.instantiateVariableFont(font, axes)
options = subset.Options()
options.layout_features = features
options.hinting = False
options.name_IDs = [0, 1, 2, 3, 4, 5, 6]
sub = subset.Subsetter(options)
sub.populate(text=text)
sub.subset(font)
font.save(out)
`;

// Only when run directly (check-fonts.mjs imports the list above).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await mkdir(srcDir, { recursive: true });
  await mkdir("fonts", { recursive: true });
  const manifest = {};

  for (const font of fonts) {
    const src = `${srcDir}/${decodeURIComponent(font.src.split("/").pop())}`;
    if (!(await exists(src))) {
      const res = await fetch(font.src);
      if (!res.ok) throw new Error(`Download failed: ${font.src} ${res.status}`);
      await writeFile(src, Buffer.from(await res.arrayBuffer()));
    }
    const text = font.text === "en" || font.text === "ar" ? await charsFor(font.text) : font.text;
    const ttf = `${srcDir}/${font.out}.subset.ttf`;
    const out = `fonts/${font.out}.woff2`;
    // -I: isolated mode, so nothing in the working directory is imported.
    const args = [src, ttf, text, JSON.stringify(font.axes ?? null), JSON.stringify(features)];
    execFileSync("python", ["-I", "-c", python, ...args], { stdio: "inherit" });
    // WOFF2 through wawoff2, so Python needs no brotli module.
    await writeFile(out, await compress(await readFile(ttf)));
    manifest[font.out] = text;
    console.log(`${out}: ${(await stat(out)).size} B`);
  }

  await writeFile("fonts/subsets.json", `${JSON.stringify(manifest, null, 2)}\n`);
}
