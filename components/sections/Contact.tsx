import { WhatsAppCta } from "@/components/bits/WhatsAppCta";
import { Mixed } from "@/components/Mixed";
import type { Content } from "@/content/types";
import { site } from "@/site.config";

const separators = [",;'`.,;'`.", ".`';,.`';,"];

/**
 * The ASCII strip: the words with alternating squiggles, twice over, so moving
 * the track by half its width loops without a seam. Always left to right, also
 * on /ar (its Arabic words still get the Arabic body face from lang="ar").
 */
function Strip({ words }: { words: string[] }) {
  const half = words.map((word, i) => (
    <span key={i}>
      {separators[i % 2]}
      {"  "}
      <span className="ar:font-body">{word}</span>
      {"  "}
    </span>
  ));
  return (
    <div aria-hidden="true" dir="ltr" className="mt-[90px] overflow-hidden border-y border-paper/20 py-3.5 ar:py-3">
      <div className="strip-drift flex w-max font-mono text-[14px] whitespace-pre text-[#8FA36E]">
        {half}
        {half}
      </div>
    </div>
  );
}

export function Contact({ t }: { t: Content["contact"] }) {
  // 44px tall to tap; the underline sits on the inner span so it hugs the text.
  const link = "inline-flex min-h-11 items-center font-mono text-[14px] text-paper no-underline ar:font-body ar:text-[15px]";

  return (
    <section id="contact" className="contact-glow on-dark bg-ink pt-[130px] pb-[90px] text-paper">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute -start-20 -bottom-[120px] h-[460px] w-[460px] opacity-60"
      >
        <circle cx="200" cy="200" r="150" fill="none" stroke="var(--accent)" strokeWidth="14" strokeOpacity=".55" filter="url(#bleed)" />
      </svg>
      <div className="wrap relative">
        <p className="rise-view type-label m-0 mb-[22px] text-muted-dark ar:mb-5">{t.label}</p>
        <h2 className="rise-view m-0 max-w-[900px] font-head text-[clamp(56px,8vw,124px)] leading-[.92] font-normal tracking-[-.02em] ar:max-w-[960px] ar:text-[clamp(52px,7vw,110px)] ar:leading-[1.25] ar:font-bold">
          <Mixed segments={t.title} />
        </h2>
        {/* The links are 44px tall, which already spaces wrapped rows on phones. */}
        <div className="rise-view mt-12 flex flex-wrap items-center gap-x-9 gap-y-1 ar:mt-11 lg:gap-y-[18px]">
          <WhatsAppCta label={t.cta} light />
          <a href={`mailto:${site.contact.email}`} className={link}>
            <span className="link-ul">{t.email(site.contact.email)}</span>
          </a>
          <a href={`https://instagram.com/${site.contact.instagram}`} className={link}>
            <span className="link-ul">{t.instagram(site.contact.instagram)}</span>
          </a>
          <a href={site.contact.portfolio} className={link}>
            <span className="link-ul">{t.portfolio}</span>
          </a>
        </div>
        <p className="rise-view type-hand m-0 mt-9 origin-left -rotate-2 text-[30px] text-muted-dark ar:mt-8 ar:text-[21px] rtl:origin-right rtl:rotate-2">
          {t.note}
        </p>
      </div>

      <Strip words={t.strip} />

      <footer className="wrap relative flex flex-wrap justify-between gap-3 pt-7 font-mono text-[12px] text-muted-dark ar:pt-[26px]">
        <span dir="ltr">{site.domain}</span>
        <span className="ar:font-body ar:text-[13px]">{t.madeBy}</span>
      </footer>
    </section>
  );
}
