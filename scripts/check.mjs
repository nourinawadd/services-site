// Checks the built site in Chrome. Dev only; run after `npm run build`.
//
//   npm run check                       whole pages
//   npm run check -- --section why      also a close-up of #why (or "header")
//   npm run check -- --widths 360,768   other widths (default 390,1440)
//
// Serves out/ and loads /en/ and /ar/ at 390px and 1440px (or --widths). It fails on any
// console error, page error or failed request, saves screenshots to
// recordings/check/, and samples the real background behind every piece of
// text (blobs included, which Lighthouse cannot do) to report anything under
// WCAG AA contrast. Screenshots use reduced motion, so scroll-revealed content
// is in its final state.

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";
import sharp from "sharp";

/** A free port, so this never tests another project's preview server by mistake. */
const PORT = await new Promise((resolve) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});
const BASE = `http://localhost:${PORT}`;
const OUT = "recordings/check";
const sectionArg = process.argv.indexOf("--section");
const section = sectionArg > -1 ? process.argv[sectionArg + 1] : null;
const widthsArg = process.argv.indexOf("--widths");
const widths = widthsArg > -1 ? process.argv[widthsArg + 1].split(",").map(Number) : [390, 1440];
const SIZES = Object.fromEntries(
  widths.map((width) => [
    width,
    width < 901
      ? { viewport: { width, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
      : { viewport: { width, height: 900 }, deviceScaleFactor: 1 },
  ]),
);

const server = spawn(process.execPath, ["node_modules/serve/build/main.js", "out", "-l", String(PORT), "-L", "-n"], {
  stdio: "ignore",
});
for (let tries = 0; ; tries++) {
  const ok = await fetch(`${BASE}/en/`).then((res) => res.ok, () => false);
  if (ok) break;
  if (tries > 50) throw new Error("serve did not start");
  await new Promise((resolve) => setTimeout(resolve, 200));
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const problems = [];

/** Fonts, then every lazy image, then back to the top. */
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    scrollTo({ top: 0, behavior: "instant" });
  });
}

/** Every visible piece of text: its box, colour and whether it counts as large text. */
function textRuns(page) {
  return page.evaluate(() => {
    const runs = [];
    for (const el of document.querySelectorAll("body *")) {
      // Decorative or part of an image (the ASCII phone): no text contrast rule applies.
      if (el.closest("[aria-hidden='true'], [role='img'], svg, script, style, noscript")) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const stroke = parseFloat(style.webkitTextStrokeWidth || "0");
      if (stroke > 0) continue; // outlined words: no fill to measure
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      runs.push({
        text: el.textContent.trim().slice(0, 50),
        color: style.color,
        large: size >= 24 || (size >= 18.66 && weight >= 700),
        box: { x: rect.left + scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height },
      });
    }
    return runs;
  });
}

const parse = (c) => c.match(/[\d.]+/g).map(Number);
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Contrast of each run against the pixels right behind its glyphs. Two
 * screenshots, with and without text: pixels that differ are where the text
 * is, and the text-free shot gives the background there.
 */
async function contrast(page, label) {
  const runs = await textRuns(page);
  const quiet = "transition:none!important;caret-color:transparent!important";
  await page.addStyleTag({ content: `*{${quiet}} .grain{display:none!important}` });
  const raw = async () =>
    sharp(await page.screenshot({ fullPage: true, animations: "disabled" }))
      .raw()
      .toBuffer({ resolveWithObject: true });
  const shown = await raw();
  await page.addStyleTag({ content: `*{color:transparent!important;-webkit-text-stroke:0!important}` });
  const hidden = await raw();
  const { info } = hidden;

  for (const run of runs) {
    const [r, g, b, a = 1] = parse(run.color);
    const scores = [];
    const x0 = Math.max(0, Math.floor(run.box.x));
    const y0 = Math.max(0, Math.floor(run.box.y));
    const x1 = Math.min(info.width, Math.ceil(run.box.x + run.box.w));
    const y1 = Math.min(info.height, Math.ceil(run.box.y + run.box.h));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels;
        const bg = [hidden.data[i], hidden.data[i + 1], hidden.data[i + 2]];
        const ink = [shown.data[i], shown.data[i + 1], shown.data[i + 2]];
        if (Math.max(...ink.map((c, k) => Math.abs(c - bg[k]))) < 40) continue; // not a glyph pixel
        const fg = [r, g, b].map((c, k) => c * a + bg[k] * (1 - a));
        scores.push(ratio(fg, bg));
      }
    }
    if (scores.length === 0) continue;
    scores.sort((x, y) => x - y);
    // 10th percentile of the glyph pixels: the background where the text is weakest.
    const score = scores[Math.floor(scores.length * 0.1)];
    const need = run.large ? 3 : 4.5;
    if (score < need) {
      problems.push(`${label} contrast ${score.toFixed(2)} < ${need}: "${run.text}" (${run.color})`);
    }
  }
}

for (const [size, options] of Object.entries(SIZES)) {
  const context = await browser.newContext({ ...options, reducedMotion: "reduce" });
  for (const lang of ["en", "ar"]) {
    const label = `/${lang}/ @${size}`;
    const page = await context.newPage();
    page.on("console", (msg) => msg.type() === "error" && problems.push(`${label} console: ${msg.text()}`));
    page.on("pageerror", (err) => problems.push(`${label} page error: ${err.message}`));
    page.on("requestfailed", (req) => problems.push(`${label} failed: ${req.url()}`));
    page.on("response", (res) => res.status() >= 400 && problems.push(`${label} ${res.status()}: ${res.url()}`));

    await page.goto(`${BASE}/${lang}/`, { waitUntil: "networkidle" });
    await settle(page);
    const shot = { animations: "disabled", caret: "hide" };
    await page.screenshot({ ...shot, path: `${OUT}/${lang}-${size}.png`, fullPage: true });
    if (section) {
      const target = section === "header" ? page.locator("header").first() : page.locator(`#${section}`);
      await target.screenshot({ ...shot, path: `${OUT}/${lang}-${size}-${section}.png` });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) problems.push(`${label} scrolls sideways by ${overflow}px`);
    await contrast(page, label);
    await page.close();
  }
  await context.close();
}

await browser.close();
server.kill();

if (problems.length) {
  console.log(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("✓ No console errors, failed requests, sideways scroll or contrast problems.");
}
console.log(`Screenshots: ${OUT}/`);
