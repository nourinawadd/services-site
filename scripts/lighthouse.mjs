// Mobile Lighthouse on the built site, 3 runs per page, median by performance.
// Dev only; run after `npm run build`. Reports go to lighthouse/ (gitignored).
//
//   npm run lighthouse

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const RUNS = 3;
const PAGES = ["en", "ar"];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

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

await mkdir("lighthouse", { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
let failed = false;

for (const lang of PAGES) {
  const runs = [];
  for (let i = 1; i <= RUNS; i++) {
    const { lhr, report } = await lighthouse(`http://localhost:${port}/${lang}/`, {
      port: chrome.port,
      output: "html",
      onlyCategories: CATEGORIES,
      logLevel: "error",
    });
    await writeFile(`lighthouse/${lang}-${i}.html`, report);
    runs.push(lhr);
  }
  runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
  const median = runs[Math.floor(RUNS / 2)];
  const scores = CATEGORIES.map((c) => `${c} ${Math.round(median.categories[c].score * 100)}`).join(" · ");
  const metrics = ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]
    .map((id) => `${id.split("-").map((w) => w[0]).join("").toUpperCase()} ${median.audits[id].displayValue}`)
    .join(" · ");
  console.log(`/${lang}/  ${scores}\n        ${metrics}`);

  // Everything that cost points in the median run.
  for (const c of CATEGORIES) {
    for (const ref of median.categories[c].auditRefs) {
      const audit = median.audits[ref.id];
      if (ref.weight > 0 && audit.score !== null && audit.score < 0.9) {
        console.log(`        ✗ ${c}: ${audit.title} (${audit.displayValue ?? Math.round(audit.score * 100)})`);
      }
    }
    if (median.categories[c].score < 0.9) failed = true;
  }
}

chrome.kill();
server.kill();
if (failed) process.exitCode = 1;
