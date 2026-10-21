// Renders the design artboards to PNG so the build can be compared side by side.
// Dev only. The artboards need an editor runtime that is not in the repo, so
// this strips it and fills the template values with their defaults.
//
//   npm run design-ref                      whole artboards
//   npm run design-ref -- --section why     also a close-up of #why (or "header")
//
// Saves recordings/design/{Main,Mobile,Main-ar,Mobile-ar}[-section].png.

import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const OUT = "recordings/design";
const sectionArg = process.argv.indexOf("--section");
const section = sectionArg > -1 ? process.argv[sectionArg + 1] : null;
const boards = { Main: 1440, Mobile: 390, "Main-ar": 1440, "Mobile-ar": 390 };
const defaults = { accent: "#2B4FD8", grain: "0.09", blobs: "0.55" };

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

for (const [name, width] of Object.entries(boards)) {
  const html = (await readFile(`design/${name}.dc.html`, "utf8"))
    .replace(/<script[^>]*src="\.\/[^"]*"><\/script>/g, "")
    .replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/, "")
    .replace(/<\/?(x-dc|helmet)>/g, "")
    .replace(/\{\{(\w+)\}\}/g, (_, key) => defaults[key]);

  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const shot = { animations: "disabled", caret: "hide" };
  await page.screenshot({ ...shot, path: `${OUT}/${name}.png`, fullPage: true });
  if (section) {
    const target = section === "header" ? page.locator("header").first() : page.locator(`#${section}`);
    await target.screenshot({ ...shot, path: `${OUT}/${name}-${section}.png` });
  }
  console.log(`Saved ${name}`);
  await page.close();
}

await browser.close();
