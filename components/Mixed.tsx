import type { CSSProperties } from "react";
import type { Mixed as Segments } from "@/content/types";

const faces = {
  out: "text-out italic ar:not-italic",
  italic: "italic",
  // English script words sit on a tight line height so they don't push lines apart.
  script: "type-script ltr:leading-[.8]",
  grot: "type-grot",
};

const colors = { moss: "text-moss", sage: "text-sage" };

/** The self-drawing ink circle around one word of the hero headline. */
function InkCircle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 130"
      preserveAspectRatio="none"
      className="absolute -start-[10%] -top-[2%] h-[112%] w-[120%] overflow-visible rtl:-start-[8%] rtl:top-[6%] rtl:h-[104%] rtl:w-[116%] rtl:-scale-x-100"
    >
      <path
        className="ink-draw"
        pathLength={1}
        d="M152 14 C 70 8, 14 34, 18 70 C 22 108, 120 124, 206 112 C 282 100, 296 52, 252 28 C 214 8, 140 6, 92 22"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.2"
        strokeLinecap="round"
        filter="url(#ink)"
      />
    </svg>
  );
}

/** A heading made of runs in different faces (see content/types.ts). */
export function Mixed({ segments }: { segments: Segments }) {
  return segments.map((seg, i) => {
    if (seg === "br") return <br key={i} />;
    const className = [seg.s && faces[seg.s], seg.color && colors[seg.color]].filter(Boolean).join(" ");
    const style: CSSProperties | undefined = seg.scale ? { fontSize: `${seg.scale}em` } : undefined;
    const run = (
      <span key={i} className={className || undefined} style={style} dir={seg.ltr ? "ltr" : undefined}>
        {seg.t}
      </span>
    );
    if (!seg.circle) return run;
    return (
      <span key={i} className="relative inline-block px-[.08em] ar:px-[.1em]">
        {run}
        <InkCircle />
      </span>
    );
  });
}
