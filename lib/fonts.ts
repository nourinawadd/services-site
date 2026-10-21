import localFont from "next/font/local";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic, Instrument_Serif } from "next/font/google";

/*
 * Every font both languages use, self-hosted by next/font. Both languages share
 * one layout, so all @font-face rules ship to both, but a browser only downloads
 * a face once text on the page uses it: /en never fetches the Arabic files.
 *
 * Body and label faces (and Instrument Serif) come whole from Google. The
 * display, script and handwriting faces, used for a few words each, are
 * subsets of only the characters the copy uses, made by scripts/fonts.mjs
 * (run `npm run fonts` after copy changes; the build checks this).
 *
 * Only the body and main heading faces are preloaded. Those are marked preload
 * here; scripts/filter-font-preloads.mjs then keeps each language's own pair
 * (EN: Geist + Instrument Serif, AR: Plex 400 + Amiri) after the build.
 * The variable names below are what that script and globals.css read.
 *
 * The decorative faces skip next/font's metric-matched fallback: each one is
 * a local() system-font lookup on the first layout, and they only set a few
 * words, so their swap cannot shift the page.
 */

// English
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const pinyon = localFont({
  src: "../fonts/pinyon-script.woff2",
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
// Bricolage Grotesque fixed at 800 and 75% width.
const bricolage = localFont({
  src: "../fonts/bricolage-800-75.woff2",
  weight: "800",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "75%" }],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const reenie = localFont({
  src: "../fonts/reenie-beanie.woff2",
  weight: "400",
  variable: "--font-reenie",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

// Both: labels and ASCII in English, the Latin bits (yourcafe.com, No. 01) in Arabic.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

// Arabic
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-ar",
  display: "swap",
});
const amiri = localFont({
  src: "../fonts/amiri-700.woff2",
  weight: "700",
  variable: "--font-amiri",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const ruqaa = localFont({
  src: "../fonts/aref-ruqaa-700.woff2",
  weight: "700",
  variable: "--font-ruqaa",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const lalezar = localFont({
  src: "../fonts/lalezar.woff2",
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const playpen = localFont({
  src: "../fonts/playpen-sans-arabic-400.woff2",
  weight: "400",
  variable: "--font-playpen",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

/** Class names defining every --font-* variable, for <html>. */
export const fontVariables = [
  geist,
  instrument,
  pinyon,
  bricolage,
  reenie,
  geistMono,
  plexArabic,
  amiri,
  ruqaa,
  lalezar,
  playpen,
]
  .map((font) => font.variable)
  .join(" ");
