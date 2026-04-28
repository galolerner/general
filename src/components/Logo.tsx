/**
 * ISEG logo (inline SVG approximation of the brand mark "ISEG / Innovación en seguridad").
 * Drop a higher-fidelity PNG/SVG at /public/logo-iseg.svg and replace this file's render
 * with <Image src="/logo-iseg.svg" /> when the real asset is available.
 */
export function Logo({ height = 34, withTagline = true }: { height?: number; withTagline?: boolean }) {
  const w = withTagline ? height * 6.4 : height * 2.8;
  return (
    <svg
      role="img"
      aria-label="ISEG — Innovación en seguridad"
      viewBox={`0 0 ${withTagline ? 320 : 140} 50`}
      width={w}
      height={height}
      style={{ display: "block" }}
    >
      <text
        x="0"
        y="40"
        fill="currentColor"
        fontFamily="Montserrat, system-ui, sans-serif"
        fontWeight="900"
        fontSize="42"
        letterSpacing="2"
      >
        ISEG
      </text>
      {withTagline ? (
        <g
          fill="currentColor"
          fontFamily="Montserrat, system-ui, sans-serif"
          fontWeight="300"
          fontSize="13"
          opacity="0.85"
        >
          <text x="150" y="22">
            Innovación
          </text>
          <text x="150" y="40">
            en seguridad
          </text>
        </g>
      ) : null}
    </svg>
  );
}
