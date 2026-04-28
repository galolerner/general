import { db } from "@/lib/db";
import { LevelCard } from "./LevelCard";

export const dynamic = "force-dynamic";

export default async function PositionsPage() {
  const [levels, tests] = await Promise.all([
    db.riskLevel.findMany({
      orderBy: { order: "asc" },
      include: {
        positions: { orderBy: { name: "asc" } },
        levelTests: { include: { test: true } },
      },
    }),
    db.test.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <section className="p-6 lg:p-8">
      <header className="mb-6">
        <p className="eyebrow mb-1">Clasificación</p>
        <h1 className="text-3xl font-light text-text">Niveles de riesgo &amp; puestos</h1>
        <p className="text-text-mid text-[13px] mt-2 max-w-3xl">
          Cada candidato hereda la batería de pruebas y los umbrales de su nivel de riesgo. Editá la
          lista de puestos, marcá pruebas como bloqueantes y ajustá los umbrales mínimos para
          contratar / contratar con observaciones.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {levels.map((l) => (
          <LevelCard
            key={l.id}
            level={{
              id: l.id,
              name: l.name,
              icon: l.icon,
              color: l.color,
              description: l.description,
              thresholdOk: l.thresholdOk,
              thresholdObs: l.thresholdObs,
              positions: l.positions.map((p) => ({ id: p.id, name: p.name })),
              tests: l.levelTests.map((lt) => ({
                id: lt.testId,
                name: lt.test.name,
                weight: lt.test.weight,
                blocking: lt.blocking,
              })),
            }}
            allTests={tests.map((t) => ({ id: t.id, name: t.name, weight: t.weight }))}
          />
        ))}
      </div>
    </section>
  );
}
