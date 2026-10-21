import type { MetadataRoute } from "next";
import { href, languages } from "@/lib/i18n";
import { site } from "@/site.config";

export const dynamic = "force-static";

const absolute = (path: string) => new URL(path, site.url).href;

/** Both languages, each listing the other as its alternate. */
export default function sitemap(): MetadataRoute.Sitemap {
  return languages.map((lang) => ({
    url: absolute(href(lang)),
    alternates: {
      languages: Object.fromEntries(languages.map((code) => [code, absolute(href(code))])),
    },
  }));
}
