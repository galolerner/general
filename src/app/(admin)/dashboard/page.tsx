import Link from "next/link";
import { db } from "@/lib/db";
import { loadCandidates } from "@/lib/candidates";
import { VerdictPill } from "@/components/VerdictPill";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [candidates, clientCount] = await Promise.all([
    loadCandidates(),
    db.client.count(),
  ]);

  const total = candidates.length;
  const ok = candidates.filter((c) => c.verdict?.verdict === "OK").length;
  const obs = candidates.filter((c) => c.verdict?.verdict === "OBS").length;
  const no = candidates.filter((c) => c.verdict?.verdict === "NO").length;

  const recent = candidates.slice(0, 12);

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
        <Stat
          num={total}
          label="Candidatos totales"
          sub={`${clientCount} cliente${clientCount === 1 ? "" : "s"} activos`}
        />
        <Stat num={ok} label="Contratar" tone="bajo" />
        <Stat num={obs} label="Con observaciones" tone="accent" />
        <Stat num={no} label="No contratar" tone="alto" />
      </section>

      <section className="p-6 lg:p-8">
        <header className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow mb-1">Actividad reciente</p>
            <h2 className="text-text text-2xl font-light">Últimos candidatos evaluados</h2>
          </div>
          <Link href="/admin/candidates" className="btn btn-ghost">
            Ver todos
          </Link>
        </header>

        {recent.length === 0 ? (
          <div className="card p-12 text-center text-text-dim">
            No hay candidatos aún. Cuando los clientes ingresen postulantes desde su portal aparecerán acá.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-dim uppercase tracking-[1.5px] text-[9px] border-b border-border">
                  <th className="px-4 py-3">Candidato</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Puesto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right">Dictamen</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface2 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        className="text-text hover:text-accent"
                      >
                        {c.lastName}, {c.firstName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 mono text-accent text-[11px]">{c.code}</td>
                    <td className="px-4 py-3 text-text-mid">{c.positionName || "—"}</td>
                    <td className="px-4 py-3 text-text-mid">
                      {c.client.icon} {c.client.name}
                    </td>
                    <td className="px-4 py-3 text-text-mid">
                      {c.level ? (
                        <span style={{ color: c.level.color }}>
                          {c.level.icon} {c.level.name}
                        </span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right mono text-text">
                      {c.verdict ? `${c.verdict.score}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <VerdictPill verdict={c.verdict?.verdict ?? null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  num,
  label,
  sub,
  tone,
}: {
  num: number;
  label: string;
  sub?: string;
  tone?: "bajo" | "accent" | "alto";
}) {
  const color =
    tone === "bajo"
      ? "text-bajo"
      : tone === "alto"
        ? "text-alto"
        : tone === "accent"
          ? "text-accent"
          : "text-text";
  return (
    <div className="px-8 py-7 border-r border-border last:border-r-0 relative overflow-hidden group">
      <div className={`mono text-4xl font-light leading-none tracking-tight ${color}`}>{num}</div>
      <div className="text-[9px] tracking-[2.5px] uppercase text-text-dim mt-2">{label}</div>
      {sub ? <div className="text-[11px] text-text-dim mt-1">{sub}</div> : null}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent opacity-0 group-hover:opacity-30 transition" />
    </div>
  );
}
