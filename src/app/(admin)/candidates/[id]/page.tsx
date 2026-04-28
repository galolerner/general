import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { loadCandidate } from "@/lib/candidates";
import { ScoreGauge } from "@/components/ScoreGauge";
import { VerdictPill } from "@/components/VerdictPill";
import { VERDICT_LABELS } from "@/lib/scoring";
import { TestsTable, AISuggestButton } from "./TestsTable";
import { ChangeLevelSelect } from "./ChangeLevelSelect";
import { DeleteCandidateButton } from "./DeleteCandidateButton";

export const dynamic = "force-dynamic";

export default async function CandidateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await loadCandidate(id);
  if (!c) notFound();

  const levels = await db.riskLevel.findMany({ orderBy: { order: "asc" } });

  const v = c.verdict;
  const score = v?.score ?? 0;
  const verdict = v?.verdict ?? "PEND";

  const resultsByTestId = Object.fromEntries(c.results.map((r) => [r.testId, r]));
  const rows = c.levelTests.map((lt) => {
    const r = resultsByTestId[lt.testId];
    const status = r?.status ?? "PENDING";
    const contribution = v?.contributions.find((co) => co.testId === lt.testId)?.contribution ?? 0;
    return {
      testId: lt.testId,
      testName: lt.test.name,
      weight: lt.test.weight,
      blocking: lt.blocking,
      apiEnabled: lt.test.apiEnabled,
      status,
      notes: r?.notes ?? "",
      contribution,
      evidenceName: r?.evidenceName ?? null,
      evidenceUrl: r?.evidenceUrl ?? null,
    };
  });

  // Top 5 contributions by absolute value (for breakdown bars)
  const topContribs = (v?.contributions ?? [])
    .filter((co) => co.status !== "PENDING")
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between gap-6 mb-7">
        <div>
          <p className="eyebrow mb-1">Ficha del candidato</p>
          <h1 className="text-3xl font-light tracking-tight text-text mb-2">
            {c.lastName}, {c.firstName}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-dim">
            <span className="mono text-accent">{c.code}</span>
            <span>•</span>
            <span>
              {c.client.icon} {c.client.name}
            </span>
            <span>•</span>
            <span>Puesto: {c.positionName || "—"}</span>
            {c.dni ? (
              <>
                <span>•</span>
                <span>DNI {c.dni}</span>
              </>
            ) : null}
            <span>•</span>
            <span>{c.date.toLocaleDateString()}</span>
            {c.evaluator ? (
              <>
                <span>•</span>
                <span>Eval: {c.evaluator}</span>
              </>
            ) : null}
            {c.fromPortal ? (
              <span className="pill pill-obs">📥 Solicitado por cliente</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <a
              href={`/api/candidates/${c.id}/pdf`}
              className="btn btn-ghost"
              title="Exportar a PDF"
            >
              <Download size={12} />
              PDF
            </a>
            <DeleteCandidateButton candidateId={c.id} />
          </div>
          <ChangeLevelSelect
            candidateId={c.id}
            levelId={c.levelId}
            levels={levels.map((l) => ({ id: l.id, name: l.name, icon: l.icon, color: l.color }))}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 mb-10 card p-6">
        <div className="flex flex-col items-center justify-center">
          <ScoreGauge score={score} verdict={verdict} />
          <div className="mt-4">
            <VerdictPill verdict={verdict} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
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
            <p className="text-text-dim text-[12px] mt-1">
              {v && c.level ? (
                <>
                  Umbrales del nivel <strong style={{ color: c.level.color }}>{c.level.name}</strong>:
                  contratar ≥ {c.level.thresholdOk}% · con observaciones ≥ {c.level.thresholdObs}%.
                </>
              ) : (
                <>Asigná un nivel de riesgo para calcular el dictamen.</>
              )}
            </p>
            {v?.blockedBy.length ? (
              <p className="text-alto text-[11px] mt-1">
                Bloqueado por prueba(s): {v.blockedBy.join(", ")}
              </p>
            ) : null}
          </div>

          <div>
            <p className="eyebrow mb-2">Top contribuciones</p>
            {topContribs.length === 0 ? (
              <p className="text-text-dim text-[12px]">Sin resultados cargados todavía.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topContribs.map((co) => {
                  const max = Math.max(...topContribs.map((x) => Math.abs(x.contribution)), 1);
                  const pct = (Math.abs(co.contribution) / max) * 100;
                  const positive = co.contribution > 0;
                  return (
                    <li key={co.testId} className="flex items-center gap-3 text-[12px]">
                      <div className="w-32 truncate text-text-mid">
                        {rows.find((r) => r.testId === co.testId)?.testName ?? co.testId}
                      </div>
                      <div className="flex-1 h-2 bg-surface2 relative overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0"
                          style={{
                            width: `${pct}%`,
                            background: positive ? "var(--bajo)" : "var(--alto)",
                          }}
                        />
                      </div>
                      <div
                        className="w-14 text-right mono"
                        style={{ color: positive ? "var(--bajo)" : "var(--alto)" }}
                      >
                        {positive ? "+" : ""}
                        {co.contribution}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <AISuggestButton candidateId={c.id} />
          </div>
        </div>
      </section>

      {c.jobs.length > 0 ? (
        <section className="mb-10">
          <h3 className="eyebrow mb-3">Historial laboral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {c.jobs.map((j) => (
              <div key={j.id} className="card p-4">
                <div className="text-text font-semibold">{j.company}</div>
                <div className="text-text-mid text-[12px]">{j.position}</div>
                <div className="text-text-dim text-[11px] mt-1">
                  {j.start || "—"} → {j.end || "Actual"}
                </div>
                {j.contact ? (
                  <div className="text-[11px] text-text-dim mt-1">
                    Contacto: {j.contact} {j.contactPhone ? `· ${j.contactPhone}` : ""}
                  </div>
                ) : null}
                {j.reason ? (
                  <div className="text-[11px] text-text-dim mt-1">
                    Motivo: <span className="text-text-mid">{j.reason}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <header className="flex items-end justify-between mb-3">
          <div>
            <h3 className="eyebrow">Pruebas de la batería</h3>
            <p className="text-text-mid text-[12px] mt-1">
              {c.levelTests.length} pruebas asignadas según el nivel{" "}
              <strong style={{ color: c.level?.color }}>{c.level?.name ?? "—"}</strong>.
            </p>
          </div>
        </header>
        {c.levelTests.length === 0 ? (
          <div className="card p-8 text-center text-text-dim">
            Asigná un nivel de riesgo para que el sistema cree la batería de pruebas.
          </div>
        ) : (
          <TestsTable candidateId={c.id} rows={rows} />
        )}
      </section>

      {c.notes ? (
        <section>
          <h3 className="eyebrow mb-2">Observaciones</h3>
          <p className="text-text-mid text-[13px] leading-relaxed whitespace-pre-line">{c.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
