import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { dirOf, getContent, href, languages } from "@/lib/i18n";
import { themeStyle } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: `${getContent("en").notFound.title} · ${getContent("ar").notFound.title}`,
  robots: { index: false },
};

/** For URLs matching no route. The language is unknown here, so both are offered. */
export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" style={themeStyle} className={fontVariables}>
      <body className="flex min-h-svh flex-col items-center justify-center gap-14 px-[22px] py-16">
        {languages.map((lang) => {
          const t = getContent(lang).notFound;
          return (
            <div key={lang} lang={lang} dir={dirOf(lang)} className="flex flex-col items-center gap-3 text-center">
              <h1 className="m-0 font-head text-[44px] leading-none font-normal ar:font-bold ar:leading-[1.3]">
                {t.title}
              </h1>
              <p className="m-0 text-body">{t.body}</p>
              <a href={href(lang)} className="link-ul font-label text-[14px]">
                {t.back}
              </a>
            </div>
          );
        })}
      </body>
    </html>
  );
}
