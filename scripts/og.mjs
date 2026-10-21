// Renders the favicons and the Open Graph images in Chrome, with the real fonts.
// Dev only; the outputs are committed.
//
//   npm run og -- icons   app/favicon.ico, app/icon.png, app/apple-icon.png
//   npm run og -- og      public/og/{en,ar}.png from the built hero (run `npm run build` first)
//   npm run og            both

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";
import sharp from "sharp";

const jobs = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const run = (job) => jobs.length === 0 || jobs.includes(job);

// Greyscale text smoothing: Windows' coloured LCD smoothing fringes text in images.
const browser = await chromium.launch({ channel: "chrome", args: ["--disable-lcd-text"] });

/** An italic "n" from the wordmark inside the hero's hand-drawn ink circle. */
async function icons() {
  const html = `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=block">
<style>
  html,body{margin:0;width:512px;height:512px;background:#F2F0EA}
  .n{position:absolute;inset:0;display:grid;place-items:center;font:italic 400 400px/1 'Instrument Serif',serif;color:#1A1B19;padding-bottom:58px;box-sizing:border-box}
  svg{position:absolute;inset:0}
</style></head><body>
<div class="n">n</div>
<svg viewBox="0 0 300 300" width="512" height="512"><path pathLength="1"
  d="M152 30 C 70 24, 22 80, 30 150 C 38 228, 120 270, 196 254 C 270 238, 286 150, 252 92 C 222 44, 150 26, 96 50"
  fill="none" stroke="#2B4FD8" stroke-width="13" stroke-linecap="round"/></svg>
</body></html>`;
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await page.close();

  await sharp(png).resize(192).png().toFile("app/icon.png");
  await sharp(png).resize(180).png().toFile("app/apple-icon.png");
  // An .ico holding one 32px RGBA PNG: a 6-byte header, one 16-byte entry, the PNG.
  const small = await sharp(png).resize(32).ensureAlpha().png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(small.length, 14); // image size
  header.writeUInt32LE(22, 18); // image offset
  await writeFile("app/favicon.ico", Buffer.concat([header, small]));
  console.log("Saved app/favicon.ico, app/icon.png, app/apple-icon.png");
}

/** The top 1200×630 of each built page, at desktop layout, as the share image. */
async function ogImages() {
  const port = await new Promise((resolve) => {
    const probe = createServer().listen(0, () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
  const server = spawn(process.execPath, ["node_modules/serve/build/main.js", "out", "-l", String(port), "-L", "-n"], {
    stdio: "ignore",
  });
  for (let tries = 0; !(await fetch(`http://localhost:${port}/en/`).then((r) => r.ok, () => false)); tries++) {
    if (tries > 50) throw new Error("serve did not start");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  await mkdir("public/og", { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  for (const lang of ["en", "ar"]) {
    await page.goto(`http://localhost:${port}/${lang}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ animations: "disabled", caret: "hide" });
    // A palette PNG is half the size; the grain hides any banding in the blobs.
    await sharp(png).png({ palette: true, quality: 95, effort: 10, dither: 0.6 }).toFile(`public/og/${lang}.png`);
    console.log(`Saved public/og/${lang}.png`);
  }
  await page.close();
  server.kill();
}

if (run("icons")) await icons();
if (run("og")) await ogImages();
await browser.close();
