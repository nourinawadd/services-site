import { AsciiPhone } from "@/components/bits/AsciiPhone";
import { WhatsAppCta } from "@/components/bits/WhatsAppCta";
import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";
import type { Lang } from "@/lib/i18n";
import { isLaunch } from "@/lib/price";

/** The breathing coffee-ring stain behind the phone. Mirrored on /ar. */
function CoffeeRing() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="ring-breathe absolute w-[112%] max-w-[520px] opacity-55 rtl:-scale-x-100"
    >
      <circle cx="200" cy="200" r="150" fill="none" stroke="var(--accent)" strokeWidth="16" strokeOpacity=".35" filter="url(#bleed)" />
      <circle cx="206" cy="194" r="138" fill="none" stroke="var(--accent)" strokeWidth="3" strokeOpacity=".3" filter="url(#bleed)" />
    </svg>
  );
}

/** The hatched leaf swaying from its stem. The wrapper mirrors it on /ar; the sway mirrors with it. */
function Leaf() {
  const leaf = { fill: "url(#hatch)", stroke: "var(--moss)", strokeWidth: 1.4 };
  return (
    <span aria-hidden="true" className="absolute end-[4%] -bottom-2.5 h-[300px] w-[150px] rtl:-scale-x-100">
      <svg viewBox="0 0 160 320" className="leaf-sway block h-full w-full">
        <path d="M84 318 C 90 250, 70 180, 92 110 C 104 70, 98 40, 112 8" fill="none" stroke="var(--moss)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M86 250 C 52 246, 22 222, 18 196 C 46 196, 74 214, 86 250 Z" {...leaf} />
        <path d="M82 200 C 116 196, 140 170, 146 142 C 116 144, 92 166, 82 200 Z" {...leaf} />
        <path d="M90 140 C 58 134, 36 108, 36 84 C 62 88, 84 108, 90 140 Z" {...leaf} />
        <path d="M100 92 C 128 84, 146 60, 148 36 C 122 42, 104 64, 100 92 Z" {...leaf} />
      </svg>
    </span>
  );
}

export function Hero({ lang, t }: { lang: Lang; t: Content["hero"] }) {
  return (
    <section id="top" className="wrap relative pt-[88px] pb-[120px]">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="relative z-[2]">
          <p className="rise-load type-label m-0 mb-7 ar:mb-6">{t.label}</p>
          <h1 className="rise-load d1 m-0 font-head text-[clamp(60px,8.6vw,132px)] leading-[.9] font-normal tracking-[-.02em] ar:text-[clamp(54px,7.4vw,116px)] ar:leading-[1.2] ar:font-bold ltr:[&_.type-grot]:tracking-[.01em]">
            <Mixed segments={t.title} />
          </h1>
          <p className="rise-load d2 m-0 mt-9 max-w-[540px] text-[19px] text-body ar:mt-[30px]">{t.sub}</p>
          <div className="rise-load d3 mt-9 flex flex-wrap items-center gap-3.5 ar:mt-[34px]">
            <WhatsAppCta label={t.cta} notice={t.ctaNotice} />
            <a
              href="#packages"
              className="link-ul inline-flex min-h-[52px] items-center px-2 font-label text-[14px] hover:text-accent ar:text-[16px]"
            >
              {t.seePackages}
            </a>
          </div>
          {isLaunch && (
            <p className="rise-load d4 type-hand m-0 ms-1.5 mt-[30px] origin-left rotate-[-3deg] text-[30px] text-accent ar:mt-7 ar:text-[21px] ar:leading-[1.4] rtl:origin-right rtl:rotate-[3deg]">
              {t.launchNote}
            </p>
          )}
        </div>

        <div className="rise-load d3 relative flex min-h-[520px] items-center justify-center">
          <CoffeeRing />
          <div className="pop-soft relative rotate-2 rounded-[28px] border-[1.5px] border-ink bg-card/86 px-7 py-[26px] rtl:-rotate-2">
            <AsciiPhone lang={lang} ascii={t.ascii} />
          </div>
          <Leaf />
          <p className="type-hand absolute start-0 top-[18px] m-0 rotate-[-6deg] text-[28px] leading-[.95] text-ink-soft ar:top-2.5 ar:text-[19px] ar:leading-[1.5] rtl:rotate-[6deg]">
            {t.sideNote.before}
            <br />
            <span dir="ltr" className="ar:font-mono ar:text-[14px]">
              {t.sideNote.file}
            </span>
            <br />
            {t.sideNote.after}
          </p>
        </div>
      </div>
    </section>
  );
}
