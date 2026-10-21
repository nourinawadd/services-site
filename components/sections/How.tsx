import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";

export function How({ t }: { t: Content["how"] }) {
  return (
    <section id="how" className="border-t-[1.5px] border-ink pt-[110px] pb-[120px]">
      <div className="wrap">
        <div className="rise-view mb-[52px] ar:mb-12">
          <p className="type-label m-0 mb-[18px] ar:mb-4">{t.label}</p>
          <h2 className="m-0 font-head text-[clamp(44px,5vw,72px)] leading-none font-normal ar:text-[clamp(42px,4.6vw,68px)] ar:leading-[1.3] ar:font-bold">
            <Mixed segments={t.title} />
          </h2>
        </div>

        <ol className="m-0 list-none border-t-[1.5px] border-ink p-0">
          {t.steps.map((step, i) => (
            <li
              key={step.title}
              className="rise-view grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 border-b border-ink/25 py-[26px] ar:py-6 lg:grid-cols-[96px_minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-8"
            >
              <span className="font-mono text-[14px] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="m-0 font-head text-[34px] leading-[1.05] font-normal ar:text-[30px] ar:leading-[1.3] ar:font-bold">
                {step.title}
              </h3>
              <p className="col-start-2 m-0 text-body lg:col-start-auto">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="rise-view mt-[72px] flex flex-wrap items-start gap-x-12 gap-y-6">
          <p className="type-hand m-0 min-w-[200px] -rotate-3 text-[32px] text-accent ar:text-[22px] rtl:rotate-3">
            {t.smallPrint[0]}
            <br />
            {t.smallPrint[1]}
          </p>
          {/* Each item owns its bottom rule. Grid rows share one height across
              both columns, so the rules line up; one column on phones. */}
          <ul className="m-0 grid min-w-0 flex-[999_1_560px] list-none grid-cols-1 gap-x-12 border-t border-accent/30 p-0 font-mono text-[13px] leading-5 text-body ar:font-body ar:text-[15px] ar:leading-6 lg:grid-cols-2">
            {t.terms.map((term) => (
              <li
                key={term}
                className="box-border flex min-h-12 items-center gap-2.5 border-b border-accent/30 py-2"
              >
                {/* Geist Mono's Google subsets have no → or ←; the system mono has narrow ones. */}
                <span aria-hidden="true" className="font-[monospace] text-accent">
                  {t.arrow}
                </span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
