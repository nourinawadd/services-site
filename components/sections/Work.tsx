import { existsSync } from "node:fs";
import { DemoVideo } from "@/components/bits/DemoVideo";
import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";
import type { Lang } from "@/lib/i18n";
import { site } from "@/site.config";

type T = Content["work"];
type Cafe = keyof T["figures"];

/** Each demo's own colours for its card, browser frame and phone bezel, from the artboard. */
const looks: Record<Cafe, { card: string; frame: string; bezel: string }> = {
  melky: { card: "bg-[#FAF6F3]", frame: "border-[#3E2F26] bg-[#F1E8D9]", bezel: "bg-[#3E2F26]" },
  ghaym: { card: "bg-[#EFEBE0]", frame: "border-[#45324D] bg-[#EFEBE0]", bezel: "bg-[#45324D]" },
};

/** Widths made by scripts/media.mjs: phone posters cut to the screen's 16:25, desktop shots to 16:9. */
const posterWidths = [300, 520];
const desktopWidths = [420, 800];

/** A lazy AVIF/WebP screenshot filling its frame from the top. */
function Shot({ base, widths, ratio, sizes }: { base: string; widths: number[]; ratio: number; sizes: string }) {
  const srcSet = (ext: string) => widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <img
        src={`${base}-${widths[0]}.webp`}
        srcSet={srcSet("webp")}
        sizes={sizes}
        width={widths[0]}
        height={Math.round(widths[0] / ratio)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
    </picture>
  );
}

/** The VP9 copy only exists when it came out smaller than the mp4 (scripts/media.mjs). */
function videoSources(cafe: Cafe) {
  const sources = [{ src: `/media/${cafe}-demo.mp4`, type: "video/mp4" }];
  if (existsSync(`public/media/${cafe}-demo.webm`)) {
    sources.unshift({ src: `/media/${cafe}-demo.webm`, type: "video/webm" });
  }
  return sources;
}

/** Ghaym's cloud, peeking out behind its phone. */
function Cloud() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 90" className="absolute end-[2%] top-[8%] w-[24%] opacity-90">
      <path
        d="M30 70 C 8 70, 6 44, 26 42 C 26 22, 56 16, 66 32 C 76 10, 112 12, 116 36 C 140 28, 158 46, 148 64 C 168 66, 166 82, 148 82 L 36 82 C 18 82, 16 70, 30 70 Z"
        fill="#D9C7DF"
        stroke="#45324D"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DemoFigure({ cafe, lang, t }: { cafe: Cafe; lang: Lang; t: T["figures"][Cafe] }) {
  const demo = site.demos[cafe];
  const look = looks[cafe];

  return (
    <figure className="rise-view m-0">
      <a href={demo.url} className="block text-ink no-underline">
        <div className={`lift relative aspect-[4/3] overflow-hidden rounded-card border-[1.5px] border-ink ${look.card}`}>
          <div
            className={`absolute start-[6%] top-[11%] w-[70%] overflow-hidden rounded-[10px] border-[1.5px] ${look.frame}`}
          >
            <div aria-hidden="true" className="flex h-3.5 items-center gap-1 px-2">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-1.5 rounded-full border border-current opacity-60" />
              ))}
            </div>
            <div className="relative aspect-video">
              <Shot
                base={`/media/${cafe}-${lang}-desktop`}
                widths={desktopWidths}
                ratio={16 / 9}
                sizes="(min-width: 901px) 400px, 66vw"
              />
            </div>
          </div>
          {cafe === "ghaym" && <Cloud />}
          {/* A plain phone: dark bezel, rounded screen and a pill-shaped island, rising from the card's edge. */}
          <div
            className={`absolute end-[7%] bottom-0 h-[80%] w-[38%] rounded-t-[26px] p-1 pb-0 lg:rounded-t-[30px] lg:p-1.5 lg:pb-0 ${look.bezel}`}
          >
            {/* The island sits in its own status-bar strip, so it never covers the site's top bar. */}
            <div className={`relative h-full overflow-hidden rounded-t-[22px] lg:rounded-t-[24px] ${look.bezel}`}>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-1 mx-auto h-2.5 w-[30%] rounded-pill bg-ink lg:top-1.5 lg:h-3"
              />
              <div className={`absolute inset-x-0 top-4 bottom-0 lg:top-5 ${look.frame}`}>
                <Shot
                  base={`/media/${cafe}-${lang}-poster`}
                  widths={posterWidths}
                  ratio={16 / 25}
                  sizes="(min-width: 901px) 220px, 40vw"
                />
                <DemoVideo sources={videoSources(cafe)} className="absolute inset-0 h-full w-full object-cover object-top" />
              </div>
            </div>
          </div>
        </div>
        <figcaption className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-2 font-mono text-[13px] ar:mt-3.5 ar:font-body ar:text-[15px]">
          <span>
            {t.fig} · <strong className="font-medium ar:font-semibold">{lang === "ar" ? demo.name_ar : demo.name_en}</strong> ·{" "}
            {t.kind}
          </span>
          <span className="text-ink-soft">{t.plan}</span>
        </figcaption>
      </a>
    </figure>
  );
}

export function Work({ lang, t }: { lang: Lang; t: T }) {
  return (
    <section id="work" className="relative pt-[120px] pb-[110px]">
      <div
        aria-hidden="true"
        className="slide-view mb-10 font-head text-[clamp(90px,13vw,200px)] leading-[.9] whitespace-nowrap text-transparent italic [-webkit-text-stroke:1.2px_rgb(26_27_25/.35)] ar:mb-7 ar:text-[clamp(80px,11vw,170px)] ar:leading-[1.3] ar:font-bold ar:not-italic"
      >
        {t.slide}
      </div>
      <div className="wrap">
        <div className="rise-view mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="type-label m-0 mb-[18px] ar:mb-4">{t.label}</p>
            <h2 className="m-0 font-head text-[clamp(44px,5vw,72px)] leading-none font-normal ar:text-[clamp(42px,4.6vw,68px)] ar:leading-[1.3] ar:font-bold">
              <Mixed segments={t.title} />
            </h2>
          </div>
          <p className="type-hand m-0 max-w-[300px] rotate-2 text-[28px] text-ink-soft ar:max-w-[320px] ar:text-[19px] rtl:-rotate-2">
            {t.note}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <DemoFigure cafe="melky" lang={lang} t={t.figures.melky} />
          <DemoFigure cafe="ghaym" lang={lang} t={t.figures.ghaym} />
        </div>
      </div>
    </section>
  );
}
