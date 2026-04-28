import type { Verdict } from "@/lib/scoring";

const LABELS: Record<Verdict, { short: string; cls: string }> = {
  OK: { short: "Contratar", cls: "pill-ok" },
  OBS: { short: "Con observ.", cls: "pill-obs" },
  NO: { short: "No contratar", cls: "pill-no" },
  PEND: { short: "Pendiente", cls: "pill-pend" },
};

export function VerdictPill({ verdict }: { verdict: Verdict | null }) {
  const v = verdict ?? "PEND";
  const { short, cls } = LABELS[v];
  return <span className={`pill ${cls}`}>{short}</span>;
}
