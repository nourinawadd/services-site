import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";
import type { Lang } from "@/lib/i18n";
import {
  addon,
  currentPrice,
  demoFor,
  formatPrice,
  isLaunch,
  onLaunchPrice,
  type Package,
  packages,
} from "@/lib/price";
import { site } from "@/site.config";

type T = Content["packages"];

/**
 * The rotating text stamp on the featured card. The text stays English on /ar,
 * as designed; direction="ltr" on the text keeps it on its path (in an RTL page
 * it runs off). Not on the <svg>: that would flip which side `end` means.
 */
function Stamp({ text }: { text: string }) {
  return (
    <svg
      aria-hidden="true"
      lang="en"
      viewBox="0 0 120 120"
      className="spin-slow absolute -end-[26px] -top-[30px] h-28 w-28"
    >
      <circle cx="60" cy="60" r="56" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
      <path id="stamp-ring" d="M60 60 m-42 0 a42 42 0 1 1 84 0 a42 42 0 1 1 -84 0" fill="none" />
      <text direction="ltr" fill="var(--accent)" className="font-mono text-[10.5px] tracking-[2.2px]">
        <textPath href="#stamp-ring">{text}</textPath>
      </text>
      <circle cx="60" cy="60" r="4" fill="var(--accent)" />
    </svg>
  );
}

/** "Brand + Site" with the plus in script. */
function PackageName({ name }: { name: string }) {
  const [first, ...rest] = name.split(" + ");
  return (
    <>
      {first}
      {rest.map((part) => (
        <span key={part}>
          {" "}
          <span className="type-script ltr:text-[1.1em]">+</span> {part}
        </span>
      ))}
    </>
  );
}

function PackageCard({ pkg, n, lang, t }: { pkg: Package; n: number; lang: Lang; t: T }) {
  const dark = Boolean(pkg.featured);
  const copy = t.items[pkg.id];
  const name = lang === "ar" ? pkg.name_ar : pkg.name_en;
  const features = lang === "ar" ? pkg.features_ar : pkg.features_en;
  const soft = dark ? "text-muted-dark" : "text-ink-soft";
  const line = dark ? "border-paper" : "border-ink";
  const demo = pkg.example_url ? site.demos[demoFor(pkg.example_url)] : null;

  return (
    <article
      className={`rise-view lift relative flex flex-col rounded-card border-[1.5px] border-ink p-7 ${
        dark ? "bg-ink text-paper" : "bg-card"
      }`}
    >
      {dark && <Stamp text={t.stamp} />}
      <div
        className={`flex justify-between gap-3 border-b-[1.5px] border-dashed pb-[18px] font-mono text-[12px] ar:pb-4 ${soft} ${
          dark ? "border-paper/40" : "border-ink/40"
        }`}
      >
        <span dir="ltr">{t.number(n, pkg.name_en)}</span>
        <span className="ar:font-label ar:text-[13px] ar:font-medium">{copy.tag}</span>
      </div>
      <h3 className="m-0 mt-[22px] mb-1.5 font-head text-[44px] leading-none font-normal ar:mt-[18px] ar:mb-1 ar:text-[42px] ar:leading-[1.3] ar:font-bold">
        <PackageName name={name} />
      </h3>
      <p className={`m-0 text-[15px] ${soft}`}>{copy.blurb}</p>
      <p className="m-0 mt-[26px] flex items-baseline gap-2 ar:mt-[22px]">
        <span dir="ltr" className="font-head text-[60px] leading-none ar:text-[58px] ar:font-bold">
          {formatPrice(currentPrice(pkg))}
        </span>
        <span className="font-label text-[13px] ar:font-medium ar:text-[14px]">{t.currency}</span>
      </p>
      {onLaunchPrice(pkg) && (
        <p className={`m-0 mt-1 font-label text-[12px] ar:font-medium ar:text-[13px] ${soft}`}>
          {t.launchMeta(formatPrice(pkg.full_price))}
        </p>
      )}
      <ul
        className={`m-0 mt-6 flex list-none flex-col gap-[9px] border-t p-0 pt-[18px] text-[15px] ar:mt-[22px] ar:gap-1.5 ar:pt-4 ${
          dark ? "border-paper/20" : "border-ink/18"
        }`}
      >
        {features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true">+ </span>
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-[22px] flex flex-wrap gap-2 font-mono text-[12px] ar:mt-5 ar:font-body ar:text-[13px]">
        {[t.days(pkg.days), t.revisions(pkg.revisions)].map((label) => (
          <span key={label} className={`rounded-pill border px-2.5 py-1.5 ar:px-3 ar:py-1 ${line}`}>
            {label}
          </span>
        ))}
      </div>
      {demo ? (
        <a
          href={demo.url}
          className={`link-ul mt-auto self-start pt-7 font-mono text-[13px] ar:pt-[26px] ar:font-body ar:text-[15px] ${
            dark ? "text-paper" : "hover:text-accent"
          }`}
        >
          {t.example(lang === "ar" ? demo.name_ar : demo.name_en)}
        </a>
      ) : (
        copy.caseStudy && (
          <a
            href={site.contact.ghaymBrand}
            className={`link-ul mt-auto self-start pt-7 font-mono text-[13px] ar:pt-[26px] ar:font-body ar:text-[15px] ${
              dark ? "text-paper" : "hover:text-accent"
            }`}
          >
            {copy.caseStudy}
          </a>
        )
      )}
    </article>
  );
}

/** The dashed add-on slip, taped on with two strips of green tape. */
function AddonSlip({ lang, t }: { lang: Lang; t: T }) {
  const tape = "absolute bg-moss/28";
  return (
    <div className="rise-view relative mt-10 rounded-card border-[1.5px] border-dashed border-ink bg-card px-[30px] py-[26px]">
      <span aria-hidden="true" className={`${tape} start-[34px] -top-[13px] h-6 w-[92px] rotate-[calc(var(--x)*-4deg)]`} />
      <span
        aria-hidden="true"
        className={`${tape} end-10 -top-[11px] h-[22px] w-[76px] rotate-[calc(var(--x)*3deg)] bg-moss/22`}
      />
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
        <p className="type-label m-0 text-ink">{t.addon.label}</p>
        <div>
          <p className="m-0 font-head text-[32px] leading-[1.05] ar:text-[32px] ar:leading-[1.3] ar:font-bold">
            {lang === "ar" ? addon.name_ar : addon.name_en}
          </p>
          <p className="m-0 mt-1.5 text-[15px] text-ink-soft ar:mt-1">{t.addon.description}</p>
        </div>
        <p className="m-0 text-end">
          <span dir="ltr" className="font-head text-[42px] leading-none ar:font-bold">
            +{formatPrice(currentPrice(addon))}
          </span>{" "}
          <span className="font-label text-[12px] ar:font-medium ar:text-[14px]">{t.currency}</span>
          {onLaunchPrice(addon) && (
            <>
              <br />
              <span className="font-label text-[12px] text-ink-soft ar:font-medium ar:text-[13px]">
                {t.addon.afterLaunch(formatPrice(addon.full_price))}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function Packages({ lang, t }: { lang: Lang; t: T }) {
  return (
    <section id="packages" className="relative border-y-[1.5px] border-ink pt-[110px] pb-[120px]">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute -end-[60px] top-[30px] h-[380px] w-[380px] opacity-50"
      >
        <circle cx="200" cy="200" r="140" fill="none" stroke="var(--moss)" strokeWidth="12" strokeOpacity=".35" filter="url(#bleed)" />
      </svg>
      <div className="wrap relative">
        <div className="rise-view mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="type-label m-0 mb-[18px] ar:mb-4">{t.label}</p>
            <h2 className="m-0 font-head text-[clamp(48px,6vw,88px)] leading-[.95] font-normal tracking-[-.015em] ar:text-[clamp(46px,5.6vw,84px)] ar:leading-[1.2] ar:font-bold">
              <Mixed segments={t.title} />
            </h2>
          </div>
          {isLaunch && (
            <p className="type-hand m-0 max-w-[300px] -rotate-2 text-[30px] text-accent ar:max-w-[320px] ar:text-[20px] rtl:rotate-2">
              {t.note}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {packages.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} n={i + 1} lang={lang} t={t} />
          ))}
        </div>

        <AddonSlip lang={lang} t={t} />
      </div>
    </section>
  );
}
