import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SvgDefs } from "@/components/SvgDefs";
import { fontVariables } from "@/lib/fonts";
import { dirOf, isLang, languages } from "@/lib/i18n";
import { jsonLdFor, metadataFor } from "@/lib/seo";
import { themeStyle } from "@/lib/theme";
import { site } from "@/site.config";
import "../globals.css";

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return metadataFor(lang);
}

export const viewport: Viewport = {
  themeColor: site.colors.paper,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} dir={dirOf(lang)} style={themeStyle} className={fontVariables}>
      <body>
        <SvgDefs />
        <div className="page">
          <div className="backdrop" aria-hidden="true" />
          {children}
        </div>
        <div className="grain" aria-hidden="true" />
        <script
          type="application/ld+json"
          // "<" escaped so the JSON can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFor(lang)).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
