// Makes every generated image and video in public/ from the design files.
// Dev only: the outputs are committed, so builds never run this.
//
//   npm run media            make whatever is missing
//   npm run media -- --force remake everything
//
// - public/bg/blobs-{desktop,mobile}.{avif,webp}: the design's colour blobs,
//   blurred and baked small, stretched over the whole page by .backdrop.
// - public/bg/contact-{desktop,mobile}.{avif,webp}: the glow in #contact.
// - public/bg/grain.webp: one tileable noise square for .grain.
// - public/media/<cafe>-<lang>-poster-<w>.{avif,webp}: the phone hero
//   screenshots, cropped from the top to the phone frame in #work.
// - public/media/<cafe>-<lang>-desktop-<w>.{avif,webp}: the desktop hero
//   screenshots, cropped from the top to 16:9 for the browser window behind it.
// - public/media/<cafe>-demo.{mp4,webm}: the recordings, cropped to the same
//   area (the frame never shows the rest), silent, small.

import { execFileSync } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const force = process.argv.includes("--force");
const exists = (path) => stat(path).then(() => true, () => false);

const colors = {
  paper: "#F2F0EA",
  ink: "#1A1B19",
  butter: "#F6CF5B",
  pink: "#F28B95",
  sky: "#7FA8EE",
  sage: "#B7CC86",
};

/**
 * The blobs exactly as the artboards place them: left and top in % of the page,
 * width and height in % of the page width (cqw), blurred by `blur` px.
 * The whole layer sits at 55% opacity over paper.
 */
const pageBlobs = [
  { left: 52, top: 1.5, w: 46, h: 34, color: "butter" },
  { left: 72, top: 6, w: 30, h: 30, color: "pink" },
  { left: -12, top: 13, w: 40, h: 30, color: "sky" },
  { left: 60, top: 22, w: 36, h: 26, color: "sage" },
  { left: -8, top: 36, w: 44, h: 30, color: "pink" },
  { left: 58, top: 47, w: 46, h: 32, color: "sky" },
  { left: 10, top: 60, w: 38, h: 28, color: "butter" },
  { left: 64, top: 70, w: 34, h: 26, color: "pink" },
];

/** The artboard sizes: Main is 1440×6400 with 70px blur, Mobile 390×12200 with 48px. */
const pages = {
  desktop: { width: 1440, height: 6400, blur: 70, out: [240, 1067] },
  mobile: { width: 390, height: 12200, blur: 48, out: [98, 3050] },
};

/** #contact, measured from the built page (about 900px tall on desktop, 1100 on phones). */
const contactBlobs = (W, H) => [
  // right: -6%; top: -10%; 40cqw × 30cqw; opacity .28
  { x: 1.06 * W - 0.4 * W, y: -0.1 * H, w: 0.4 * W, h: 0.3 * W, color: "pink", opacity: 0.28 },
  // right: 26%; bottom: 8%; 30cqw × 22cqw; opacity .18
  { x: 0.74 * W - 0.3 * W, y: 0.92 * H - 0.22 * W, w: 0.3 * W, h: 0.22 * W, color: "butter", opacity: 0.18 },
];
const contacts = {
  desktop: { width: 1440, height: 900, blur: 70, out: [240, 150] },
  mobile: { width: 390, height: 1100, blur: 48, out: [98, 276] },
};

function ellipse({ x, y, w, h, color, opacity = 1 }) {
  return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${colors[color]}" fill-opacity="${opacity}"/>`;
}

/** A blurred blob field as SVG, rendered at a quarter size (the blur hides it all). */
function blobSvg({ width, height, blur, background, layerOpacity, blobs }) {
  const scale = 0.25;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" viewBox="0 0 ${width} ${height}">
  <defs><filter id="b" filterUnits="userSpaceOnUse" x="${-width}" y="${-height}" width="${width * 3}" height="${height * 3}"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
  <rect width="100%" height="100%" fill="${background}"/>
  <g filter="url(#b)" opacity="${layerOpacity}">${blobs.map(ellipse).join("")}</g>
</svg>`;
}

async function bake(name, svg, [w, h]) {
  const base = join("public/bg", name);
  if (!force && (await exists(`${base}.avif`)) && (await exists(`${base}.webp`))) return;
  const image = sharp(Buffer.from(svg)).resize(w, h, { fit: "fill" });
  await image.clone().avif({ quality: 60, effort: 9, chromaSubsampling: "4:4:4" }).toFile(`${base}.avif`);
  await image.clone().webp({ quality: 80, effort: 6 }).toFile(`${base}.webp`);
  const sizes = await Promise.all([stat(`${base}.avif`), stat(`${base}.webp`)]);
  console.log(`bg/${name}: avif ${sizes[0].size} B, webp ${sizes[1].size} B`);
}

async function backgrounds() {
  await mkdir("public/bg", { recursive: true });

  for (const [size, page] of Object.entries(pages)) {
    const blobs = pageBlobs.map((b) => ({
      x: (b.left / 100) * page.width,
      y: (b.top / 100) * page.height,
      w: (b.w / 100) * page.width,
      h: (b.h / 100) * page.width,
      color: b.color,
    }));
    await bake(
      `blobs-${size}`,
      blobSvg({ ...page, background: colors.paper, layerOpacity: 0.55, blobs }),
      page.out,
    );
  }

  for (const [size, section] of Object.entries(contacts)) {
    await bake(
      `contact-${size}`,
      blobSvg({
        ...section,
        background: colors.ink,
        layerOpacity: 1,
        blobs: contactBlobs(section.width, section.height),
      }),
      section.out,
    );
  }

  // The artboard's grain filter (fractalNoise at 0.85, desaturated), as one
  // seamless 128px tile instead of a live full-page filter.
  const grain = "public/bg/grain.webp";
  if (force || !(await exists(grain))) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
  <filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="128" height="128" filter="url(#g)"/>
</svg>`;
    await sharp(Buffer.from(svg)).webp({ quality: 70, effort: 6 }).toFile(grain);
    console.log(`bg/grain: webp ${(await stat(grain)).size} B`);
  }
}

/**
 * The phone screen in #work measures 0.643 to 0.663 (w:h), so posters and
 * videos are cut a touch narrower, at 16:25: the full width always shows and
 * object-cover only trims a few px off the bottom. Posters at two widths: the
 * screen is about 200 CSS px wide on desktop and 110-320 on phones and tablets.
 */
const FRAME = 16 / 25;
const POSTER_WIDTHS = [300, 520];
const cafes = ["melky", "ghaym"];

async function posters() {
  await mkdir("public/media", { recursive: true });
  for (const cafe of cafes) {
    for (const lang of ["en", "ar"]) {
      const src = `design/assets/${cafe}-${lang}-phone-hero.png`;
      const { width } = await sharp(src).metadata();
      const crop = { left: 0, top: 0, width, height: Math.round(width / FRAME) };
      for (const w of POSTER_WIDTHS) {
        const base = `public/media/${cafe}-${lang}-poster-${w}`;
        if (!force && (await exists(`${base}.avif`)) && (await exists(`${base}.webp`))) continue;
        const image = sharp(src).extract(crop).resize(w);
        await image.clone().avif({ quality: 52, effort: 9 }).toFile(`${base}.avif`);
        await image.clone().webp({ quality: 74, effort: 6 }).toFile(`${base}.webp`);
        const sizes = await Promise.all([stat(`${base}.avif`), stat(`${base}.webp`)]);
        console.log(`media/${cafe}-${lang}-poster-${w}: avif ${sizes[0].size} B, webp ${sizes[1].size} B`);
      }
    }
  }
}

/**
 * The browser window behind the phone shows the top of the desktop hero at
 * 16:9. It is about 390 CSS px wide on desktop and 250 on phones, so 800
 * covers 2x and 3x screens and 420 the rest.
 */
const DESKTOP = 16 / 9;
const DESKTOP_WIDTHS = [420, 800];

async function desktops() {
  await mkdir("public/media", { recursive: true });
  for (const cafe of cafes) {
    for (const lang of ["en", "ar"]) {
      const src = `design/assets/${cafe}-${lang}-desktop-hero.png`;
      const { width } = await sharp(src).metadata();
      const crop = { left: 0, top: 0, width, height: Math.round(width / DESKTOP) };
      for (const w of DESKTOP_WIDTHS) {
        const base = `public/media/${cafe}-${lang}-desktop-${w}`;
        if (!force && (await exists(`${base}.avif`)) && (await exists(`${base}.webp`))) continue;
        const image = sharp(src).extract(crop).resize(w);
        await image.clone().avif({ quality: 52, effort: 9 }).toFile(`${base}.avif`);
        await image.clone().webp({ quality: 74, effort: 6 }).toFile(`${base}.webp`);
        const sizes = await Promise.all([stat(`${base}.avif`), stat(`${base}.webp`)]);
        console.log(`media/${cafe}-${lang}-desktop-${w}: avif ${sizes[0].size} B, webp ${sizes[1].size} B`);
      }
    }
  }
}

/**
 * 480x752 at 24fps, the top of each recording, no audio. Both sides stay
 * multiples of 16: Chrome's hardware VP9 decoder on Windows garbled every
 * frame at 480x750. H.264 plays everywhere; the VP9 copy is kept only when it
 * is smaller (the page lists whichever files exist).
 */
async function videos() {
  await mkdir("public/media", { recursive: true });
  const crop = `crop=iw:iw/${FRAME}:0:0,scale=480:752,setsar=1,fps=24`;
  for (const cafe of cafes) {
    const src = `design/assets/${cafe}-demo.mp4`;
    const mp4 = `public/media/${cafe}-demo.mp4`;
    const webm = `public/media/${cafe}-demo.webm`;
    // The webm is only remade with the mp4, so a dropped one stays dropped.
    if (!force && (await exists(mp4))) continue;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", crop, "-an", "-c:v", "libx264", "-preset", "veryslow",
      "-crf", "31", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", crop, "-an", "-c:v", "libvpx-vp9", "-crf", "40",
      "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", webm]);
    const [h264, vp9] = await Promise.all([stat(mp4), stat(webm)]);
    console.log(`${mp4}: ${h264.size} B`);
    if (vp9.size >= h264.size) {
      await rm(webm);
      console.log(`${webm}: dropped, ${vp9.size} B is not smaller than the mp4`);
    } else {
      console.log(`${webm}: ${vp9.size} B`);
    }
  }
}

await backgrounds();
await posters();
await desktops();
await videos();
console.log("media: done");
