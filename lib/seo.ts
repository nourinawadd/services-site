import type { Metadata } from "next";
import { defaultLanguage, getContent, href, type Lang, languages, otherLang } from "@/lib/i18n";
import { addon, currentPrice, packages } from "@/lib/price";
import { site } from "@/site.config";

const ogLocales: Record<Lang, string> = { en: "en_US", ar: "ar_EG" };

/** Title, description, canonical, hreflang and Open Graph for a language's page. */
export function metadataFor(lang: Lang): Metadata {
  const { meta } = getContent(lang);
  return {
    metadataBase: new URL(site.url),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: href(lang),
      languages: {
        ...Object.fromEntries(languages.map((code) => [code, href(code)])),
        "x-default": href(defaultLanguage),
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name[lang],
      title: meta.title,
      description: meta.description,
      url: href(lang),
      locale: ogLocales[lang],
      alternateLocale: ogLocales[otherLang(lang)],
      images: [{ url: `/og/${lang}.png`, width: 1200, height: 630, alt: meta.ogAlt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** schema.org ProfessionalService, with the packages as offers so prices stay in step with packages.json. */
export function jsonLdFor(lang: Lang) {
  const { meta } = getContent(lang);
  const url = new URL(href(lang), site.url).href;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#business`,
    name: site.name[lang],
    url,
    description: meta.description,
    inLanguage: lang,
    image: new URL(`/og/${lang}.png`, site.url).href,
    email: site.contact.email,
    telephone: `+${site.contact.whatsapp}`,
    areaServed: { "@type": "Country", name: "Egypt" },
    address: { "@type": "PostalAddress", addressLocality: "Mansoura", addressCountry: "EG" },
    sameAs: [`https://instagram.com/${site.contact.instagram}`, site.contact.portfolio],
    makesOffer: [...packages, addon].map((item) => ({
      "@type": "Offer",
      price: currentPrice(item),
      priceCurrency: "EGP",
      itemOffered: { "@type": "Service", name: lang === "ar" ? item.name_ar : item.name_en },
    })),
  };
}
