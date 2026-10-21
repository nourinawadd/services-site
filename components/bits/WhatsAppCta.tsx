import { site } from "@/site.config";

/** The pill button to WhatsApp, with the blue offset shadow. `light` is the version on the dark section. */
export function WhatsAppCta({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <a
      href={`https://wa.me/${site.contact.whatsapp}`}
      className={`nudge pop-accent inline-flex items-center gap-2.5 rounded-pill font-medium no-underline ${
        light ? "min-h-14 bg-paper px-[30px] text-ink" : "min-h-[52px] bg-ink px-[26px] text-paper"
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
      </svg>
      {label}
    </a>
  );
}
