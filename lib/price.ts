import data from "@/data/packages.json";
import { site, type DemoId } from "@/site.config";

export type Package = {
  id: "starter" | "standard" | "brand";
  name_en: string;
  name_ar: string;
  featured?: boolean;
  /** null (or equal to full_price) once launch pricing is over. */
  launch_price: number | null;
  full_price: number;
  days: number;
  /** A count, or a string such as "2 + 2". */
  revisions: number | string;
  features_en: string[];
  features_ar: string[];
  example_url: string | null;
};

export type Addon = {
  id: string;
  for: Package["id"];
  name_en: string;
  name_ar: string;
  launch_price: number | null;
  full_price: number;
  days: number;
};

export const packages = data.packages as Package[];
export const addon = data.addon as Addon;

/** Western digits, thousands separator, no decimals: 2,500. Same in both languages. */
const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatPrice(value: number) {
  return priceFormat.format(value);
}

type Priced = { launch_price: number | null; full_price: number };

export function onLaunchPrice(item: Priced) {
  return item.launch_price !== null && item.launch_price < item.full_price;
}

/** The price shown big: the launch price while it lasts, then the full price. */
export function currentPrice(item: Priced) {
  return onLaunchPrice(item) ? item.launch_price! : item.full_price;
}

/** True while any package is on launch pricing. Hides the launch notes when false. */
export const isLaunch = packages.some(onLaunchPrice) || onLaunchPrice(addon);

/** The demo a package links to as its example, matched by url. */
export function demoFor(url: string): DemoId {
  const match = (Object.keys(site.demos) as DemoId[]).find((id) => site.demos[id].url === url);
  if (!match) throw new Error(`packages.json example_url ${url} matches no demo in site.config.ts`);
  return match;
}
