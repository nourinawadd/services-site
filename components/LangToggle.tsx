"use client";

import type { MouseEvent } from "react";
import { dirOf, href, type Lang, otherLang, sections } from "@/lib/i18n";

const shortNames: Record<Lang, string> = { en: "EN", ar: "عربي" };

/** The section you are looking at: the URL hash, else the one crossing the middle of the screen. */
function currentSection() {
  if (location.hash) return location.hash.slice(1);
  const middle = innerHeight / 2;
  let current: string = sections[0];
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= middle) current = id;
  }
  return current;
}

/**
 * EN | عربي as two plain links (the other language is a separate document with
 * its own lang, dir and fonts). Current language first in DOM order, so the pair
 * looks the same both ways round. Without JS the link goes to the top of the
 * other page; with JS it keeps the section you are on.
 */
export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const other = otherLang(lang);

  function keepSection(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = currentSection();
    event.currentTarget.href = id === "top" ? href(other) : `${href(other)}#${id}`;
  }

  const item =
    "flex min-h-9 items-center px-3.5 no-underline font-label tracking-normal";
  const sizes = (code: Lang) => (code === "ar" ? "text-[13px]" : "text-[12px]");

  return (
    <nav aria-label={label} className="flex shrink-0 overflow-hidden rounded-pill border border-ink">
      <a
        href={href(lang)}
        aria-current="page"
        lang={lang}
        className={`${item} ${sizes(lang)} bg-ink text-paper`}
      >
        {shortNames[lang]}
      </a>
      <a
        href={href(other)}
        hrefLang={other}
        lang={other}
        dir={dirOf(other)}
        onClick={keepSection}
        className={`${item} ${sizes(other)} text-ink hover:bg-ink/8`}
      >
        {shortNames[other]}
      </a>
    </nav>
  );
}
