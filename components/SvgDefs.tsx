/**
 * Shared SVG filters and patterns. `ink` roughens hand-drawn strokes (the
 * circles), `bleed` makes the coffee-ring stains. Only small decorative SVGs
 * use them; nothing page-wide is filtered live.
 */
export function SvgDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={5} />
        </filter>
        <filter id="bleed" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={4} seed={2} />
          <feDisplacementMap in="SourceGraphic" scale={22} />
          <feGaussianBlur stdDeviation={0.8} />
        </filter>
        <pattern
          id="hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(38)"
        >
          <rect width="1.7" height="5" fill="var(--moss)" />
        </pattern>
      </defs>
    </svg>
  );
}
