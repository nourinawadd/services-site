import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";

/** The red hand-drawn ring around the PDF pill. Mirrored on /ar. */
function PdfCircle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 60"
      preserveAspectRatio="none"
      className="absolute -start-[6%] -top-[18%] h-[136%] w-[112%] overflow-visible rtl:-scale-x-100"
    >
      <path
        d="M40 8 C 120 0, 280 6, 292 30 C 300 52, 160 60, 60 54 C 4 50, 0 20, 70 10"
        fill="none"
        stroke="var(--warn)"
        strokeWidth="2.4"
        strokeLinecap="round"
        filter="url(#ink)"
      />
    </svg>
  );
}

const pill =
  "block rounded-pill border-[1.5px] border-ink/50 px-[18px] py-3 text-center text-[14px] text-ink-soft ar:py-2.5";

export function Why({ t }: { t: Content["why"] }) {
  return (
    <section id="why" className="wrap pb-[130px]">
      <div className="border-t border-ink/18 pt-16">
        <div className="rise-view mb-[52px] flex flex-wrap items-end justify-between gap-8">
          {/* 750, not the artboard's 760: our fonts set the first line ~3px narrower, and this keeps its line break. */}
          <div className="max-w-[750px]">
            <p className="type-label m-0 mb-[18px] ar:mb-4">{t.label}</p>
            <h2 className="m-0 font-head text-[clamp(44px,5.4vw,80px)] leading-[.98] font-normal tracking-[-.015em] ar:text-[clamp(40px,4.8vw,72px)] ar:leading-[1.3] ar:font-bold ltr:[&_.type-script]:leading-[.7]">
              <Mixed segments={t.title} />
            </h2>
          </div>
          <p className="m-0 max-w-[380px] text-[16px] text-body ar:max-w-[400px]">{t.intro}</p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-7 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <div className="rise-view lift relative rounded-card border-[1.5px] border-ink/45 bg-card/70 p-7">
            <p className="type-label m-0 mb-5 text-[12px]">{t.usual.label}</p>
            <div aria-hidden="true" className="mb-[26px] flex max-w-[300px] flex-col gap-2.5">
              {t.usual.pills.map((name) => (
                <span key={name} lang="en" className={pill}>
                  {name}
                </span>
              ))}
              <span lang="en" className={`${pill} relative font-mono text-[13px]`}>
                {t.usual.pdf}
                <PdfCircle />
              </span>
            </div>
            <p className="type-hand absolute end-[22px] top-[70px] m-0 hidden rotate-[7deg] text-[28px] leading-[.95] text-warn lg:block ar:text-[20px] ar:leading-[1.5] rtl:-rotate-[7deg]">
              {t.usual.zoom.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
            <ul className="m-0 flex list-none flex-col gap-[9px] border-t border-ink/18 p-0 pt-[18px] text-[15px] text-ink-soft ar:gap-2">
              {t.usual.cons.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">× </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rise-view lift pop-sage relative rounded-card border-[1.5px] border-ink bg-card p-7">
            <p className="type-label m-0 mb-[18px] text-[12px] text-ink">{t.own.label}</p>
            <p className="m-0 mb-6 rounded-lg border border-ink/25 bg-paper px-4 py-3 font-mono text-[13px] [overflow-wrap:anywhere] text-body ar:font-body ar:text-[14px]">
              {t.own.google.prefix}
              <span className="text-accent">{t.own.google.query}</span>
              <br />
              <span className="text-ink-soft">{t.own.google.arrow}</span>
              <strong dir="ltr" className="font-mono font-medium">
                {t.own.google.domain}
              </strong>
              <span className="text-ink-soft">{t.own.google.rest}</span>
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[16px] ar:gap-2">
              {t.own.pros.map((item) => (
                <li key={item}>
                  <span aria-hidden="true" className="font-semibold text-moss">
                    ✓
                  </span>{" "}
                  {item}
                </li>
              ))}
            </ul>
            <p className="type-hand m-0 mt-6 origin-left -rotate-2 text-[29px] text-accent ar:mt-[22px] ar:text-[20px] rtl:origin-right rtl:rotate-2">
              {t.own.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
