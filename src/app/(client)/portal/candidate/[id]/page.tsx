import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadCandidate } from "@/lib/candidates";
import { ScoreGauge } from "@/components/ScoreGauge";
import { VerdictPill } from "@/components/VerdictPill";
import { VERDICT_LABELS } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function ClientCandidateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const c = await loadCandidate(id);
  if (!c) notFound();
  if (c.clientId !== session?.user.clientId) redirect("/portal");

  const v = c.verdict;
  const score = v?.score ?? 0;
  const verdict = v?.verdict ?? "PEND";

  return (
    <section className="px-8 py-8 max-w-5xl mx-auto">
      <Link href="/portal" className="text-text-dim text-[11px] hover:text-accent">
        ← Volver al portal
      </Link>

      <header className="flex items-start justify-between gap-6 mt-3 mb-6">
        <div>
          <p className="eyebrow mb-1">Postulante</p>
          <h1 className="text-3xl font-light text-text">
            {c.lastName}, {c.firstName}
          </h1>
          <div className="flex flex-wrap gap-x-3 text-[11px] text-text-dim mt-1">
            <span className="mono text-accent">{c.code}</span>
            <span>•</span>
            <span>Puesto: {c.positionName || "—"}</span>
            <span>•</span>
            <span>{c.date.toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      <section className="card p-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 mb-8">
        <div className="flex flex-col items-center justify-center">
          <ScoreGauge score={score} verdict={verdict} />
          <div className="mt-3">
            <VerdictPill verdict={verdict} />
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2">Dictamen</p>
          <h3
            className="text-2xl font-bold"
            style={{
              color:
                verdict === "OK"
                  ? "var(--bajo)"
                  : verdict === "OBS"
                    ? "var(--accent)"
                    : verdict === "NO"
                      ? "var(--alto)"
                      : "var(--text-dim)",
            }}
          >
            {VERDICT_LABELS[verdict]}
          </h3>
          {c.level ? (
            <p className="text-text-dim text-[12px] mt-1">
              Nivel <strong style={{ color: c.level.color }}>{c.level.name}</strong> · umbral
              CONTRATAR ≥ {c.level.thresholdOk}% · CON OBS. ≥ {c.level.thresholdObs}%
            </p>
          ) : null}

          <h4 className="eyebrow mt-6 mb-2">Pruebas</h4>
          <ul className="flex flex-col gap-1">
            {c.levelTests.map((lt) => {
              const r = c.results.find((rr) => rr.testId === lt.testId);
              const status = r?.status ?? "PENDING";
              const pillCls =
                status === "OK"
                  ? "pill-ok"
                  : status === "OBS"
                    ? "pill-rev"
                    : status === "FAIL"
                      ? "pill-no"
                      : "pill-pend";
              return (
                <li
                  key={lt.testId}
                  className="flex items-center justify-between text-[12px] py-1.5 border-b border-border last:border-b-0"
                >
                  <span className="text-text-mid">{lt.test.name}</span>
                  <span className={`pill ${pillCls}`}>
                    {status === "OK"
                      ? "OK"
                      : status === "OBS"
                        ? "Obs."
                        : status === "FAIL"
                          ? "No apto"
                          : "Pendiente"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {c.notes ? (
        <section>
          <h3 className="eyebrow mb-2">Observaciones</h3>
          <p className="text-text-mid text-[13px] whitespace-pre-line">{c.notes}</p>
        </section>
      ) : null}
    </section>
  );
}
