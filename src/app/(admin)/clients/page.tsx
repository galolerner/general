import Link from "next/link";
import { db } from "@/lib/db";
import { computeVerdict } from "@/lib/scoring";
import { ClientFormModal } from "./ClientFormModal";
import { DeleteClientButton } from "./DeleteClientButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await db.client.findMany({
    orderBy: { name: "asc" },
    include: {
      candidates: {
        include: { level: true, results: true },
      },
      users: { where: { role: "CLIENT" }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  // For each candidate compute verdict to count ok / no
  const levelTests = await db.levelTest.findMany({ include: { test: true } });
  const ltByLevel = levelTests.reduce<Record<string, typeof levelTests>>((acc, lt) => {
    (acc[lt.levelId] ??= []).push(lt);
    return acc;
  }, {});

  return (
    <section className="p-6 lg:p-8">
      <header className="flex items-end justify-between mb-7">
        <div>
          <p className="eyebrow mb-1">Administración</p>
          <h1 className="text-3xl font-light text-text">Clientes</h1>
        </div>
        <ClientFormModal mode="create" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c) => {
          let ok = 0;
          let no = 0;
          for (const cand of c.candidates) {
            const lts = cand.levelId ? ltByLevel[cand.levelId] ?? [] : [];
            if (!cand.level || lts.length === 0) continue;
            const v = computeVerdict({
              thresholdOk: cand.level.thresholdOk,
              thresholdObs: cand.level.thresholdObs,
              tests: lts.map((lt) => ({
                testId: lt.testId,
                weight: lt.test.weight,
                scoreOk: lt.test.scoreOk,
                scoreObs: lt.test.scoreObs,
                scoreFail: lt.test.scoreFail,
                blocking: lt.blocking,
              })),
              results: cand.results.reduce<Record<string, (typeof cand.results)[number]["status"]>>(
                (acc, r) => {
                  acc[r.testId] = r.status;
                  return acc;
                },
                {},
              ),
            });
            if (v.verdict === "OK") ok++;
            if (v.verdict === "NO") no++;
          }
          const primaryEmail = c.users[0]?.email ?? "—";
          return (
            <article key={c.id} className="card p-5">
              <header className="flex items-start gap-3 mb-4">
                <div className="text-3xl">{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text truncate">{c.name}</h3>
                  <div className="text-text-dim text-[11px] truncate">{c.industry || "—"}</div>
                  <div className="text-text-dim text-[11px] truncate mono">{primaryEmail}</div>
                </div>
              </header>

              <div className="grid grid-cols-3 border-t border-border pt-4 text-center">
                <div>
                  <div className="text-text mono text-2xl font-light">{c.candidates.length}</div>
                  <div className="text-[9px] tracking-[1.5px] uppercase text-text-dim mt-1">
                    Total
                  </div>
                </div>
                <div className="border-x border-border">
                  <div className="text-bajo mono text-2xl font-light">{ok}</div>
                  <div className="text-[9px] tracking-[1.5px] uppercase text-text-dim mt-1">
                    Aptos
                  </div>
                </div>
                <div>
                  <div className="text-alto mono text-2xl font-light">{no}</div>
                  <div className="text-[9px] tracking-[1.5px] uppercase text-text-dim mt-1">
                    No aptos
                  </div>
                </div>
              </div>

              <footer className="mt-5 flex items-center justify-between">
                <Link
                  href={`/admin/candidates?client=${c.id}`}
                  className="text-accent text-[11px] tracking-[1.5px] uppercase font-bold hover:underline"
                >
                  Ver candidatos →
                </Link>
                <div className="flex gap-1">
                  <ClientFormModal
                    mode="edit"
                    client={{
                      id: c.id,
                      name: c.name,
                      industry: c.industry ?? "",
                      icon: c.icon,
                      email: primaryEmail,
                    }}
                  />
                  <DeleteClientButton clientId={c.id} clientName={c.name} />
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
