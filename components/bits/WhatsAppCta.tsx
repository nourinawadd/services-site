"use client";

import { useEffect, useId, useState } from "react";

/**
 * The pill button to WhatsApp, out of service for now: dimmed, and pressing it
 * shows `notice` instead of opening wa.me. `light` is the version on the dark section.
 */
export function WhatsAppCta({ label, notice, light = false }: { label: string; notice: string; light?: boolean }) {
  const [open, setOpen] = useState(false);
  const noticeId = useId();

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={open ? noticeId : undefined}
        onClick={() => setOpen(true)}
        className={`inline-flex cursor-not-allowed items-center gap-2.5 rounded-pill border border-dashed font-medium opacity-60 ${
          light
            ? "min-h-14 border-paper/60 bg-transparent px-[30px] text-paper"
            : "min-h-[52px] border-ink/50 bg-transparent px-[26px] text-ink"
        }`}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 rtl:-scale-x-100"
        >
          <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" />
          <path d="M3 3l18 18" />
        </svg>
        <span className="line-through">{label}</span>
      </button>
      <span
        id={noticeId}
        role="status"
        className={`absolute top-full start-0 z-10 mt-2 w-max max-w-[280px] rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-lg transition-opacity ${
          light ? "bg-paper text-ink" : "bg-ink text-paper"
        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {open ? notice : ""}
      </span>
    </span>
  );
}
