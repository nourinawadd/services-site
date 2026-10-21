import { LangToggle } from "@/components/LangToggle";
import type { Content } from "@/content/types";
import type { Lang } from "@/lib/i18n";

export function Header({ lang, t }: { lang: Lang; t: Content["header"] }) {
  const nav = [
    ["packages", t.nav.packages],
    ["work", t.nav.work],
    ["how", t.nav.how],
    ["contact", t.nav.contact],
  ] as const;

  return (
    <header className="wrap flex items-center justify-between gap-6 border-b border-ink/18 py-[22px] font-label text-[13px] tracking-[.02em] ar:text-[15px]">
      <a href="#top" className="flex items-baseline gap-2.5 text-ink no-underline">
        <span className="font-head text-[30px] leading-none italic tracking-normal ar:font-script ar:not-italic ar:font-bold">
          {t.wordmark}
        </span>
        <span className="text-ink-soft ar:font-medium ar:text-[14px]">{t.wordmarkSub}</span>
      </a>
      <nav aria-label={t.navLabel} className="hidden items-center gap-7 lg:flex">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="link-ul hover:text-accent">
            {label}
          </a>
        ))}
      </nav>
      <LangToggle lang={lang} label={t.languageLabel} />
    </header>
  );
}
