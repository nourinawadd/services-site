import { Header } from "@/components/Header";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { How } from "@/components/sections/How";
import { Packages } from "@/components/sections/Packages";
import { Why } from "@/components/sections/Why";
import { Work } from "@/components/sections/Work";
import { getContent, type Lang } from "@/lib/i18n";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = (await params).lang as Lang;
  const t = getContent(lang);

  return (
    <>
      <Header lang={lang} t={t.header} />
      <main>
        <Hero lang={lang} t={t.hero} />
        <Why t={t.why} />
        <Packages lang={lang} t={t.packages} />
        <Work lang={lang} t={t.work} />
        <How t={t.how} />
        <Contact t={t.contact} />
      </main>
    </>
  );
}
