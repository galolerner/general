import type { Verdict } from "@/lib/scoring";

const COLOR: Record<Verdict, string> = {
  OK: "var(--bajo)",
  OBS: "var(--accent)",
  NO: "var(--alto)",
  PEND: "var(--text-dim)",
};

export function ScoreGauge({
  score,
  verdict,
  size = 220,
}: {
  score: number;
  verdict: Verdict;
  size?: number;
}) {
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = COLOR[verdict];
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={10}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[42px] font-light leading-none mono" style={{ color }}>
          {score}
        </div>
        <div className="text-[9px] tracking-[2px] uppercase text-text-dim mt-1">Score</div>
      </div>
    </div>
  );
}
