/**
 * Every site-wide detail: domain, contact links, demo sites and the colour
 * tokens. Copy lives in content/, prices in data/packages.json.
 * Values in [brackets] in the comments are placeholders to fill in.
 */
export const site = {
  name: { en: "Nourin", ar: "نورين" },
  domain: "services.nourin.is-a.dev",
  url: "https://services.nourin.is-a.dev",

  contact: {
    /** [YOUR-NUMBER] International format, digits only, for wa.me: 20 + number without the leading 0. */
    whatsapp: "201550580490",
    /** [YOUR-EMAIL] */
    email: "nourinawad@gmail.com",
    /** [HANDLE] Instagram handle without the @. */
    instagram: "nourinawadd",
    portfolio: "https://nourin.is-a.dev",
    /** Ghaym's brand case study, the Brand + Site package's example. */
    ghaymBrand: "https://www.behance.net/gallery/257444243/Ghaym-Brand-Identity-Website-for-a-Dessert-Caf",
  },

  /** The demo cafés in #work. packages.json example_url values must match one of these urls. */
  demos: {
    melky: { name_en: "Melky", name_ar: "ملكي", url: "https://melky-cafe.vercel.app/" },
    ghaym: { name_en: "Ghaym", name_ar: "غيم", url: "https://ghaym-bakery.vercel.app/" },
  },

  /** Set as CSS variables on <html> and mapped to Tailwind colours in app/globals.css. */
  colors: {
    paper: "#F2F0EA",
    card: "#F8F7F2",
    ink: "#1A1B19",
    inkSoft: "#4A4C46",
    body: "#33352F",
    mutedOnDark: "#C9C7BE",
    accent: "#2B4FD8",
    moss: "#56703A",
    sage: "#B7CC86",
    /** Only the circled PDF and the "zoom" note. */
    warn: "#C2410C",
  },

  /** Background blob colours, baked into public/bg by scripts/media.mjs (keep the two in step). */
  blobs: {
    butter: "#F6CF5B",
    pink: "#F28B95",
    sky: "#7FA8EE",
    sage: "#B7CC86",
  },
} as const;

export type DemoId = keyof typeof site.demos;
