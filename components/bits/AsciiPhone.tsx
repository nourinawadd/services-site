import { Fragment, type ReactNode } from "react";
import type { Content } from "@/content/types";
import type { Lang } from "@/lib/i18n";

type Ascii = Content["hero"]["ascii"];

/** Inner width of the phone, in characters, between the two | borders. */
const W = 22;
const top = `.${"-".repeat(W)}.`;
const bottom = `'${"-".repeat(W)}'`;
const row = (inner: string) => `|${inner.padEnd(W)}|`;
const blank = row("");

/**
 * The phone is 24 monospace characters wide (0.6em each in Geist Mono). The
 * width is fixed in px, so the swap from the fallback font cannot resize it.
 */
const boxWidth = "calc(24 * 0.6 * 14px)";

const cursor = (
  <span className="blink text-accent" aria-hidden="true">
    ▍
  </span>
);

/** English: one <pre>, every row built to the exact width. */
function EnglishPhone({ ascii }: { ascii: Ascii }) {
  const items = ascii.items.map(([name, price]) => row(`   ${name.padEnd(17 - price.length)}${price}`));
  const button = `   ${ascii.button}`;
  const lines = [top, blank, row(`   ${ascii.title}`), row("   · · · · · · · ·"), blank, ...items, blank];
  return (
    <pre
      role="img"
      aria-label={ascii.label}
      className="m-0 font-mono text-[14px] leading-[1.32] text-body"
      style={{ width: boxWidth }}
    >
      {lines.join("\n")}
      {`\n|${button}`}
      {cursor}
      {`${" ".repeat(W - button.length - 1)}|\n`}
      {[blank, row("         (  )"), bottom].join("\n")}
    </pre>
  );
}

/** Arabic: the frame stays monospace and left to right; the rows inside are Arabic. */
function ArabicPhone({ ascii }: { ascii: Ascii }) {
  const frame = (inner: ReactNode, className = "") => (
    <div className="flex">
      <span>|</span>
      <span dir="rtl" className={`box-border w-[22ch] px-[2ch] ${className}`}>
        {inner}
      </span>
      <span>|</span>
    </div>
  );
  const empty = frame(null);
  return (
    <div
      role="img"
      aria-label={ascii.label}
      dir="ltr"
      className="font-mono text-[14px] leading-[1.5] whitespace-pre text-body"
      style={{ width: boxWidth }}
    >
      <div>{top}</div>
      {empty}
      {frame(ascii.title, "font-display text-[15px]")}
      {frame("· · · · · · · ·")}
      {ascii.items.map(([name, price]) => (
        <Fragment key={name}>
          {frame(
            <>
              <span className="font-body text-[13px]">{name}</span>
              <span>{price}</span>
            </>,
            "flex justify-between",
          )}
        </Fragment>
      ))}
      {empty}
      {frame(
        <span className="font-body text-[13px]">
          {ascii.button}
          {cursor}
        </span>,
      )}
      {empty}
      <div className="flex">
        <span>|</span>
        <span className="w-[22ch] text-center">(  )</span>
        <span>|</span>
      </div>
      <div>{bottom}</div>
    </div>
  );
}

export function AsciiPhone({ lang, ascii }: { lang: Lang; ascii: Ascii }) {
  return lang === "ar" ? <ArabicPhone ascii={ascii} /> : <EnglishPhone ascii={ascii} />;
}
