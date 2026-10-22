// Records the Behance case study clips from the built site. Dev only; run after `npm run build`.
//
//   node scripts/behance-clips.mjs           all four clips
//   node scripts/behance-clips.mjs 2 4       only clips 2 and 4
//
// Serves out/ with motion on and captures frame by frame instead of recording
// video, so nothing drops: every time-based animation (CSS animations and
// transitions) is paused and seeked to the frame's time, demo videos are
// seeked the same way, and scroll clips move scrollY a set amount per frame
// (scroll-driven animations follow on their own). Frames are shot at 2x (3x
// for the close-ups), framed on paper with an ink border like the case study
// page, and piped to ffmpeg. Writes MP4s and poster PNGs to recordings/behance/.

import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";
import sharp from "sharp";

const OUT = "recordings/behance";
const FPS = 30;
const PAPER = "#F2F0EA";
const INK = "#1A1B19";
const LABEL = "#4A4C46";
const only = process.argv.slice(2).map(Number);

/** A free port, so this never records another project's preview server by mistake. */
const PORT = await new Promise((resolve) => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});
const BASE = `http://localhost:${PORT}`;

const server = spawn(process.execPath, ["node_modules/serve/build/main.js", "out", "-l", String(PORT), "-L", "-n"], {
  stdio: "ignore",
});
for (let tries = 0; ; tries++) {
  const ok = await fetch(`${BASE}/en/`).then((res) => res.ok, () => false);
  if (ok) break;
  if (tries > 150) throw new Error("serve did not start");
  await new Promise((resolve) => setTimeout(resolve, 200));
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

// ---------------------------------------------------------------------------
// The page clock. Installed before any page script runs.

/**
 * window.__clip.freeze(offset) pauses every animation on the document timeline
 * and pins it to `offset` ms in (0 rewinds to a fresh load, a large number
 * means long settled). window.__clip.tick(ms) then seeks everything to that
 * time; animations and transitions that start later begin at the tick that
 * first sees them. Videos never really play: play() only marks them, and tick
 * seeks each marked one forward by the frame's time.
 */
function clock() {
  const offsets = new Map();
  let now = 0;
  let last = 0;

  const media = HTMLMediaElement.prototype;
  media.play = function () {
    if (!this.__want && this.readyState < 2) {
      this.preload = "auto";
      this.load();
    }
    this.__want = true;
    return Promise.resolve();
  };
  media.pause = function () {
    this.__want = false;
  };

  const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function seekVideos(dt) {
    for (const video of document.querySelectorAll("video")) {
      if (!video.__want) continue;
      for (let i = 0; video.readyState < 2 && i < 100; i++) await timeout(30);
      if (video.readyState < 2) continue;
      if (video.__pos === undefined) {
        video.__pos = 0;
        video.dispatchEvent(new Event("playing"));
      } else {
        video.__pos += dt / 1000;
      }
      const target = video.__pos % video.duration;
      if (Math.abs(video.currentTime - target) < 1e-4) continue;
      const seeked = new Promise((resolve) => video.addEventListener("seeked", resolve, { once: true }));
      video.currentTime = target;
      await Promise.race([seeked, timeout(2000)]);
    }
  }

  window.__clip = {
    freeze(offset) {
      for (const anim of document.getAnimations()) {
        if (anim.timeline !== document.timeline) continue;
        anim.pause();
        offsets.set(anim, offset);
        anim.currentTime = offset;
      }
      now = last = 0;
    },
    async tick(ms, scrollY) {
      if (scrollY !== undefined) scrollTo({ top: scrollY, behavior: "instant" });
      now = ms;
      for (const anim of document.getAnimations()) {
        if (anim.timeline !== document.timeline) continue;
        if (!offsets.has(anim)) {
          anim.pause();
          offsets.set(anim, -now);
        }
        anim.currentTime = Math.max(0, now + offsets.get(anim));
      }
      await seekVideos(now - last);
      last = now;
      await frame();
    },
  };
}

// ---------------------------------------------------------------------------
// Pages

async function open(path, { width, height, scale = 2, mobile = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(clock);
  const page = await context.newPage();
  page.cdp = await context.newCDPSession(page);
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Every lazy image loaded and decoded, then back to the top. */
async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    scrollTo({ top: 0, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

/** A lossless shot of the viewport, or of `clip` in viewport CSS px, at the page's scale. */
async function shoot(page, clip) {
  const params = { format: "png", optimizeForSpeed: true };
  if (clip) {
    // The protocol's clip is in document coordinates.
    const [x, y] = await page.evaluate(() => [scrollX, scrollY]);
    params.clip = { ...clip, x: clip.x + x, y: clip.y + y, scale: 1 };
  }
  const { data } = await page.cdp.send("Page.captureScreenshot", params);
  return Buffer.from(data, "base64");
}

// ---------------------------------------------------------------------------
// Easing and scroll paths

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Section tops to stop at: the very top, then each section after the hero, clamped and deduped. */
function stopsOf(page, lead) {
  return page.evaluate((lead) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const tops = [...document.querySelectorAll("main > section")].map((s, i) =>
      i === 0 ? 0 : Math.min(max, Math.max(0, Math.round(s.getBoundingClientRect().top + scrollY - lead))),
    );
    return tops.filter((top, i) => i === 0 || top - tops[i - 1] > 40);
  }, lead);
}

/**
 * A scroll path through `stopLists` (one list per page, same length), pausing
 * `hold` seconds at every stop and easing between them. Each move gets time
 * by distance^0.7, so long sections are slower without dragging. Returns, per
 * frame, one scrollY per page.
 */
function scrollPath(stopLists, seconds, hold) {
  const frames = Math.round(seconds * FPS);
  const n = stopLists[0].length;
  const holdFrames = Math.round(hold * FPS);
  const moveFrames = frames - holdFrames * n;
  const weights = [];
  for (let i = 1; i < n; i++) {
    const dist = stopLists.reduce((sum, stops) => sum + stops[i] - stops[i - 1], 0) / stopLists.length;
    weights.push(dist ** 0.7);
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let left = moveFrames;
  const moves = weights.map((w, i) => {
    const f = i === weights.length - 1 ? left : Math.round((moveFrames * w) / total);
    left -= f;
    return f;
  });

  const path = [];
  const at = (i) => stopLists.map((stops) => stops[i]);
  for (let i = 0; i < n; i++) {
    for (let f = 0; f < holdFrames; f++) path.push(at(i));
    if (i === n - 1) break;
    for (let f = 1; f <= moves[i]; f++) {
      const e = easeInOut(f / moves[i]);
      path.push(stopLists.map((stops) => Math.round((stops[i] + (stops[i + 1] - stops[i]) * e) * 100) / 100));
    }
  }
  return path;
}

// ---------------------------------------------------------------------------
// Framing and encoding

/** Paper with an antialiased 1.5px ink border around each recording slot, plus any overlays. */
async function backdrop(width, height, slots, overlays = []) {
  const rects = slots
    .map(
      (s) =>
        `<rect x="${s.left - 0.75}" y="${s.top - 0.75}" width="${s.width + 1.5}" height="${s.height + 1.5}" fill="none" stroke="${INK}" stroke-width="1.5"/>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${PAPER}"/>${rects}</svg>`;
  return sharp(Buffer.from(svg)).composite(overlays).removeAlpha().raw().toBuffer();
}

/** An ffmpeg encoder fed raw RGB frames on stdin. */
function encoder(file, width, height) {
  const ff = spawn(
    "ffmpeg",
    [
      "-y", "-loglevel", "error",
      "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${width}x${height}`, "-r", String(FPS), "-i", "-",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", "18",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
      "-movflags", "+faststart", "-an", file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((resolve, reject) =>
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code} on ${file}`)))),
  );
  return {
    write: (buf) => new Promise((resolve) => (ff.stdin.write(buf) ? resolve() : ff.stdin.once("drain", resolve))),
    end: () => (ff.stdin.end(), done),
  };
}

/**
 * Frames each set of screenshots into its slots on the backdrop and encodes
 * them. Compositing runs while the next frame is being shot. Saves frame
 * `posterAt` as the poster PNG.
 */
function framer(name, width, height, base, slots, posterAt) {
  const enc = encoder(`${OUT}/${name}.mp4`, width, height);
  let pending = Promise.resolve();
  let index = 0;
  return {
    add(shots) {
      const i = index++;
      const prev = pending;
      pending = (async () => {
        const layers = await Promise.all(
          shots.map(async (png, s) => {
            const { data, info } = await sharp(png)
              .resize(slots[s].width, slots[s].height, { kernel: "lanczos3" })
              .raw()
              .toBuffer({ resolveWithObject: true });
            return { input: data, raw: info, left: slots[s].left, top: slots[s].top };
          }),
        );
        const raw = { width, height, channels: 3 };
        const frame = await sharp(base, { raw }).composite(layers).removeAlpha().raw().toBuffer();
        await prev;
        await enc.write(frame);
        if (i === posterAt) await sharp(frame, { raw }).png().toFile(`${OUT}/${name}.png`);
      })();
      return prev;
    },
    async end() {
      await pending;
      await enc.end();
    },
  };
}

/** The slot for one desktop recording: 60px each side, centered vertically, at the viewport's aspect. */
function desktopSlot(width, height, viewport) {
  const w = width - 120;
  const h = Math.round((w * viewport.height) / viewport.width);
  return { left: 60, top: Math.round((height - h) / 2), width: w, height: h };
}

const log = (name, i, total) => {
  if (i % 30 === 0 || i === total - 1) process.stdout.write(`\r${name}: frame ${i + 1}/${total}`);
  if (i === total - 1) process.stdout.write("\n");
};

// ---------------------------------------------------------------------------
// Clips

const DESKTOP = { width: 1440, height: 900 };

/** 1. The hero loading: rise, then the ink circle drawing itself, then a hold. */
async function heroLoad() {
  const name = "01-hero-load";
  const [W, H] = [1400, 940];
  const slot = desktopSlot(W, H, DESKTOP);
  const page = await open("/en/", DESKTOP);
  await page.evaluate(() => window.__clip.freeze(0));

  // 0.8s of the empty first paint, then 5.2s of page time: the rise and the
  // circle (done 2.5s in), then a hold with the ring and leaf still moving.
  const lead = Math.round(0.8 * FPS);
  const frames = 6 * FPS;
  const out = framer(name, W, H, await backdrop(W, H, [slot]), [slot], lead + Math.round(2.6 * FPS));
  for (let i = 0; i < frames; i++) {
    await page.evaluate((ms) => window.__clip.tick(ms), Math.max(0, i - lead) * (1000 / FPS));
    await out.add([await shoot(page)]);
    log(name, i, frames);
  }
  await out.end();
  await page.context().close();
}

/** 2. The whole English page, top to bottom, pausing on each section. */
async function desktopScroll() {
  const name = "02-desktop-scroll";
  const [W, H] = [1400, 940];
  const slot = desktopSlot(W, H, DESKTOP);
  const page = await open("/en/", DESKTOP);
  await settle(page);
  await page.evaluate(() => window.__clip.freeze(10000));

  const path = scrollPath([await stopsOf(page, 40)], 24, 1);
  const out = framer(name, W, H, await backdrop(W, H, [slot]), [slot], 0);
  for (let i = 0; i < path.length; i++) {
    await page.evaluate(([ms, y]) => window.__clip.tick(ms, y), [i * (1000 / FPS), path[i][0]]);
    await out.add([await shoot(page)]);
    log(name, i, path.length);
  }
  await out.end();
  await page.context().close();
}

/** A small Geist Mono label, shot from a page that has the font, at 1x. */
async function label(page, text) {
  await page.evaluate(async (text) => {
    const el = document.createElement("div");
    el.id = "__label";
    el.textContent = text;
    el.style.cssText =
      "position:fixed;left:0;top:0;z-index:2147483647;padding:2px 6px;background:#F2F0EA;color:#4A4C46;" +
      "font-family:var(--font-mono);font-size:13px;line-height:16px;letter-spacing:.14em";
    document.body.append(el);
    await document.fonts.load(`13px ${getComputedStyle(el).fontFamily}`);
  }, text);
  const png = await page.locator("#__label").screenshot();
  await page.evaluate(() => document.getElementById("__label").remove());
  const meta = await sharp(png).metadata();
  const width = Math.round(meta.width / 2);
  return { input: await sharp(png).resize(width).png().toBuffer(), width, height: Math.round(meta.height / 2) };
}

/** 3. /en/ and /ar/ on phones, side by side, reaching each section together. */
async function phones() {
  const name = "03-phones";
  const [W, H] = [1400, 1100];
  const phone = { width: 390, height: 844, mobile: true };
  const pages = [await open("/en/", phone), await open("/ar/", phone)];
  for (const page of pages) await settle(page);

  const labels = [await label(pages[0], "EN"), await label(pages[0], "AR")];
  const [w, h, gap, under] = [416, 900, 60, 18];
  const block = h + 1.5 + under + labels[0].height;
  const top = Math.round((H - block) / 2);
  const left = Math.round((W - (w * 2 + gap)) / 2);
  const slots = [0, 1].map((i) => ({ left: left + i * (w + gap), top, width: w, height: h }));
  const overlays = labels.map((l, i) => ({
    input: l.input,
    left: Math.round(slots[i].left + (w - l.width) / 2),
    top: Math.round(top + h + 1.5 + under),
  }));

  for (const page of pages) await page.evaluate(() => window.__clip.freeze(10000));
  const stops = await Promise.all(pages.map((page) => stopsOf(page, 20)));
  // Both pages need the same stops; drop any section only one of them could reach.
  const n = Math.min(...stops.map((s) => s.length));
  const path = scrollPath(
    stops.map((s) => s.slice(0, n)),
    15,
    0.6,
  );

  const out = framer(name, W, H, await backdrop(W, H, slots, overlays), slots, 0);
  for (let i = 0; i < path.length; i++) {
    const shots = [];
    for (const [p, page] of pages.entries()) {
      await page.evaluate(([ms, y]) => window.__clip.tick(ms, y), [i * (1000 / FPS), path[i][p]]);
      shots.push(await shoot(page));
    }
    await out.add(shots);
    log(name, i, path.length);
  }
  await out.end();
  for (const page of pages) await page.context().close();
}

/** A crop of the given aspect around a box, with room around it, kept inside the viewport. */
function cropAround(box, height, aspect, viewport) {
  const width = Math.round(height * aspect);
  const x = Math.min(viewport.width - width, Math.max(0, box.x + box.width / 2 - width / 2));
  const y = Math.min(viewport.height - height, Math.max(0, box.y + box.height / 2 - height / 2));
  return { x: Math.round(x), y: Math.round(y), width, height };
}

/** An arrow pointer drawn into the page, since headless screenshots have no cursor. */
const CURSOR = `<svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L2 23 L7.5 17.8 L11.2 26.6 L14.8 25.1 L11.1 16.4 L18.6 16.4 Z" fill="#1A1B19" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

/** 4. Three close-ups cut together: the ink circle, the sliding outline text, the WhatsApp button. */
async function details() {
  const name = "04-details";
  const [W, H] = [1400, 800];
  const slot = { left: 60, top: 60, width: W - 120, height: H - 120 };
  const aspect = slot.width / slot.height;
  const seg = 4 * FPS;
  const page = await open("/en/", { ...DESKTOP, scale: 3 });
  const out = framer(name, W, H, await backdrop(W, H, [slot]), [slot], seg - 1);
  let vt = 0;
  const tick = (ms, y) => page.evaluate(([ms, y]) => window.__clip.tick(ms, y), [ms, y]);

  // a) The circle around "cafés", from just after the headline rises in. The
  // crop takes the whole headline's height so no line is cut through, and
  // stops short of the label above it.
  await page.evaluate(() => window.__clip.freeze(0));
  await tick(5000);
  const circle = await page.locator("h1 svg").boundingBox();
  const headline = await page.locator("h1").boundingBox();
  const cropA = cropAround(
    { x: circle.x, width: circle.width, y: headline.y + 10, height: headline.height },
    Math.round(headline.height + 40),
    aspect,
    DESKTOP,
  );
  for (let i = 0; i < seg; i++) {
    await tick(450 + i * (1000 / FPS));
    await out.add([await shoot(page, cropA)]);
    log(name, i, seg * 3);
  }

  // b) "selected cafés" sliding as #work scrolls up. The crop follows the line
  // so only its slide moves it; the heading below rises in as it nears.
  await settle(page);
  vt = 20000;
  const slide = page.locator("#work .slide-view");
  const metrics = await slide.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  });
  // A short crop leaves the line more room to travel, so it slides further.
  const cropH = 300;
  const cropW = Math.round(cropH * aspect);
  // Keep the crop inside the viewport: the line's centre stays between cropH/2 and 900 - cropH/2.
  const centreFrom = DESKTOP.height - cropH / 2 - 10;
  const centreTo = cropH / 2 + 10;
  for (let i = 0; i < seg; i++) {
    const centre = centreFrom + (centreTo - centreFrom) * easeSine(i / (seg - 1));
    const y = metrics.top + metrics.height / 2 - centre;
    await tick(vt + i * (1000 / FPS), y);
    const crop = { x: Math.round((DESKTOP.width - cropW) / 2), y: Math.round(centre - cropH / 2), width: cropW, height: cropH };
    await out.add([await shoot(page, crop)]);
    log(name, seg + i, seg * 3);
  }

  // c) The WhatsApp button: the pointer comes in (hover lifts it), presses
  // (it sinks into its shadow) and lets go. The live site has no pressed
  // state yet, so the clip adds one: the button moves onto its shadow.
  // Scrolled a little so the whole crop is inside the viewport.
  vt = 40000;
  await tick(vt, 240);
  const button = page.locator("#top a.pop-accent");
  await page.evaluate((svg) => {
    const style = document.createElement("style");
    style.textContent = `
      .nudge.pop-accent { transition: translate .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s cubic-bezier(.2,.7,.2,1); }
      .nudge.pop-accent:active { translate: calc(var(--x) * 4px) 4px; box-shadow: 0 0 0 var(--accent); transition-duration: .12s; }
      #__cursor { position: fixed; z-index: 2147483647; pointer-events: none; transform-origin: 2px 2px; transition: scale .12s; }
      #__cursor.down { scale: .88; }`;
    document.head.append(style);
    const cursor = document.createElement("div");
    cursor.id = "__cursor";
    cursor.innerHTML = svg;
    document.body.append(cursor);
    document.querySelector("#top a.pop-accent").addEventListener("click", (e) => e.preventDefault());
  }, CURSOR);
  // The button and the note under it, with the paragraph above left out.
  const box = await button.boundingBox();
  const cropC = { x: Math.round(box.x - 30), y: Math.round(box.y - 62), width: Math.round(250 * aspect), height: 250 };
  const from = { x: cropC.x + cropC.width * 0.86, y: cropC.y + cropC.height * 0.9 };
  const to = { x: box.x + box.width * 0.62, y: box.y + box.height * 0.55 };
  const place = (p) =>
    page.evaluate(({ x, y }) => {
      const c = document.getElementById("__cursor");
      c.style.left = `${x - 2}px`;
      c.style.top = `${y - 2}px`;
    }, p);
  for (let i = 0; i < seg; i++) {
    const t = i / FPS;
    const e = easeInOut(Math.min(1, Math.max(0, (t - 0.35) / 0.9)));
    const p = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
    await page.mouse.move(p.x, p.y);
    await place(p);
    if (i === Math.round(2.1 * FPS)) {
      await page.mouse.down();
      await page.evaluate(() => document.getElementById("__cursor").classList.add("down"));
    }
    if (i === Math.round(2.75 * FPS)) {
      await page.mouse.up();
      await page.evaluate(() => document.getElementById("__cursor").classList.remove("down"));
    }
    await tick(vt + i * (1000 / FPS));
    await out.add([await shoot(page, cropC)]);
    log(name, seg * 2 + i, seg * 3);
  }

  await out.end();
  await page.context().close();
}

// ---------------------------------------------------------------------------

const clips = [heroLoad, desktopScroll, phones, details];
try {
  for (const [i, clip] of clips.entries()) if (!only.length || only.includes(i + 1)) await clip();
} finally {
  await browser.close();
  server.kill();
}

const probe = (file) =>
  new Promise((resolve) => {
    const ff = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height,nb_frames", "-of", "json", file]);
    let json = "";
    ff.stdout.on("data", (d) => (json += d));
    ff.on("close", () => resolve(JSON.parse(json)));
  });
console.log("");
for (const [i, clip] of ["01-hero-load", "02-desktop-scroll", "03-phones", "04-details"].entries()) {
  if (only.length && !only.includes(i + 1)) continue;
  const file = `${OUT}/${clip}.mp4`;
  const info = await probe(file);
  const { width, height, nb_frames } = info.streams[0];
  const mb = ((await stat(file)).size / 1e6).toFixed(1);
  const kb = Math.round((await stat(`${OUT}/${clip}.png`)).size / 1e3);
  console.log(
    `${file}  ${width}x${height}  ${(+info.format.duration).toFixed(2)}s  ${nb_frames} frames  ${mb} MB   + ${clip}.png ${kb} KB`,
  );
}
