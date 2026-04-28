import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadCandidates } from "@/lib/candidates";
import { VerdictPill } from "@/components/VerdictPill";

export const dynamic = "force-dynamic";

export default async function PortalIndex() {
  const session = await auth();
  if (!session?.user.clientId) return null;

  const client = await db.client.findUnique({ where: { id: session.user.clientId } });
  const candidates = await loadCandidates({ clientId: session.user.clientId });

  const stats = candidates.reduce(
    (a, c) => {
      a.total++;
      const v = c.verdict?.verdict ?? "PEND";
      if (v === "OK") a.ok++;
      else if (v === "OBS") a.obs++;
      else if (v === "NO") a.no++;
      else a.pend++;
      return a;
    },
    { total: 0, ok: 0, obs: 0, no: 0, pend: 0 },
  );

  return (
    <>
      <section
        className="px-8 py-10 border-b border-border"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 60%, rgba(43,214,197,.07) 0%, transparent 70%)",
        }}
      >
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="text-6xl">{client?.icon}</div>
            <div>
              <p className="eyebrow mb-1">Portal de evaluaciones</p>
              <h1 className="text-4xl font-light text-text">{client?.name}</h1>
              <p className="text-text-dim text-[12px] mt-1">{client?.industry}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/portal/intake" className="btn btn-accent">
              <Plus size={12} />
              Ingresar candidato
            </Link>
            <Link href="/portal/intake/bulk" className="btn btn-ghost">
              <Upload size={12} />
              Carga masiva
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px mt-8 bg-border">
          <Stat num={stats.total} label="Total" />
          <Stat num={stats.ok} label="Aptos" tone="bajo" />
          <Stat num={stats.obs} label="En revisión" tone="accent" />
          <Stat num={stats.no} label="No aptos" tone="alto" />
          <Stat num={stats.pend} label="Pendientes" />
        </div>
      </section>

      <section className="px-8 py-6">
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="eyebrow mb-1">Mis postulantes</p>
            <h2 className="text-2xl font-light text-text">
              {candidates.length} candidato{candidates.length === 1 ? "" : "s"}
            </h2>
          </div>
        </header>

        {candidates.length === 0 ? (
          <div className="card p-12 text-center text-text-dim">
            Aún no ingresaste ningún candidato.{" "}
            <Link href="/portal/intake" className="text-accent">
              Cargá el primero
            </Link>{" "}
            o{" "}
            <Link href="/portal/intake/bulk" className="text-accent">
              importá un CSV
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((c) => (
              <Link
                key={c.id}
                href={`/portal/candidate/${c.id}`}
                className="card p-4 hover:border-border2 transition"
              >
                <header className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-text truncate">
                      {c.lastName}, {c.firstName}
                    </div>
                    <div className="text-text-dim text-[11px] mono truncate">{c.code}</div>
                  </div>
                  <VerdictPill verdict={c.verdict?.verdict ?? null} />
                </header>
                <div className="text-text-mid text-[12px]">{c.positionName || "—"}</div>
                <div className="text-text-dim text-[10px] mt-1">
                  {c.level ? (
                    <span style={{ color: c.level.color }}>
                      {c.level.icon} {c.level.name}
                    </span>
                  ) : (
                    "Sin clasificar"
                  )}
                  {" · "}
                  {c.date.toLocaleDateString()}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface2">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${c.verdict?.score ?? 0}%` }}
                    />
                  </div>
                  <div className="mono text-text text-[12px]">{c.verdict?.score ?? 0}%</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  num,
  label,
  tone,
}: {
  num: number;
  label: string;
  tone?: "bajo" | "alto" | "accent";
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
    <div className="bg-bg p-5">
      <div className={`mono text-3xl font-light ${color}`}>{num}</div>
      <div className="text-[9px] tracking-[2px] uppercase text-text-dim mt-1">{label}</div>
    </div>
  );
}
