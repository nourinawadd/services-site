/**
 * One run of a mixed-font heading. `s` picks the face:
 *   out     outlined (transparent fill, stroke in the current colour)
 *   italic  the heading face in italic
 *   script  Pinyon Script / Aref Ruqaa
 *   grot    Bricolage condensed caps / Lalezar
 * `scale` is the font size relative to the heading (1.22 → 1.22em).
 * `circle` draws the self-drawing ink circle around the run.
 * `ltr` marks a Latin run inside Arabic, such as "PDF".
 */
export type Segment =
  | {
      t: string;
      s?: "out" | "italic" | "script" | "grot";
      scale?: number;
      color?: "moss" | "sage";
      circle?: boolean;
      ltr?: boolean;
    }
  | "br";

export type Mixed = Segment[];

export type PackageId = "starter" | "standard" | "brand";

export type Content = {
  meta: { title: string; description: string; ogAlt: string };
  header: {
    wordmark: string;
    wordmarkSub: string;
    navLabel: string;
    nav: { packages: string; work: string; how: string; contact: string };
    languageLabel: string;
  };
  hero: {
    label: string;
    title: Mixed;
    sub: string;
    cta: string;
    seePackages: string;
    launchNote: string;
    ascii: { label: string; title: string; items: [string, string][]; button: string };
    sideNote: { before: string; file: string; after: string };
  };
  why: {
    label: string;
    title: Mixed;
    intro: string;
    usual: { label: string; pills: string[]; pdf: string; zoom: string[]; cons: string[] };
    own: {
      label: string;
      google: { prefix: string; query: string; arrow: string; domain: string; rest: string };
      pros: string[];
      note: string;
    };
  };
  packages: {
    label: string;
    title: Mixed;
    note: string;
    currency: string;
    stamp: string;
    /** The ticket header's start side: "No. 01" / "No. 01 · STARTER". */
    number: (n: number, nameEn: string) => string;
    launchMeta: (fullPrice: string) => string;
    days: (n: number) => string;
    revisions: (r: number | string) => string;
    example: (demoName: string) => string;
    items: Record<PackageId, { tag: string; blurb: string; noExample?: string }>;
    addon: { label: string; description: string; afterLaunch: (fullPrice: string) => string };
  };
  work: {
    slide: string;
    label: string;
    title: Mixed;
    note: string;
    figures: Record<"melky" | "ghaym", { fig: string; kind: string; plan: string }>;
  };
  how: {
    label: string;
    title: Mixed;
    steps: { title: string; body: string }[];
    smallPrint: string[];
    arrow: string;
    terms: string[];
  };
  contact: {
    label: string;
    title: Mixed;
    cta: string;
    email: (address: string) => string;
    instagram: (handle: string) => string;
    portfolio: string;
    note: string;
    strip: string[];
    madeBy: string;
  };
  notFound: { title: string; body: string; back: string };
};
