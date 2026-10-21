import { ar } from "@/content/ar";
import { en } from "@/content/en";
import type { Content } from "@/content/types";

export const languages = ["en", "ar"] as const;

export type Lang = (typeof languages)[number];

export const defaultLanguage: Lang = "en";

export function isLang(value: string): value is Lang {
  return (languages as readonly string[]).includes(value);
}

export function dirOf(lang: Lang) {
  return lang === "ar" ? "rtl" : "ltr";
}

export function otherLang(lang: Lang): Lang {
  return lang === "ar" ? "en" : "ar";
}

/** "/en/", to match `trailingSlash: true`. */
export function href(lang: Lang) {
  return `/${lang}/`;
}

/** Section ids, in page order. The language toggle keeps whichever one you are on. */
export const sections = ["top", "why", "packages", "work", "how", "contact"] as const;

const content: Record<Lang, Content> = { en, ar };

export function getContent(lang: Lang): Content {
  return content[lang];
}
