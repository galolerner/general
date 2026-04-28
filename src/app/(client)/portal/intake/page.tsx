import Link from "next/link";
import { db } from "@/lib/db";
import { IntakeForm } from "./IntakeForm";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const positions = await db.position.findMany({
    include: { level: true },
    orderBy: { name: "asc" },
  });
  return (
    <section className="px-8 py-8 max-w-4xl mx-auto">
      <header className="flex items-end justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">Carga unitaria</p>
          <h1 className="text-3xl font-light text-text">Ingresar candidato</h1>
          <p className="text-text-mid text-[13px] mt-2 max-w-2xl">
            Completá los datos del postulante. ISEG ejecutará automáticamente la batería de pruebas
            asociada al nivel de riesgo del puesto seleccionado.
          </p>
        </div>
        <Link href="/portal/intake/bulk" className="btn btn-ghost">
          Carga masiva (CSV) →
        </Link>
      </header>

      <IntakeForm
        positions={positions.map((p) => ({
          id: p.id,
          name: p.name,
          levelName: p.level.name,
          levelColor: p.level.color,
          levelIcon: p.level.icon,
        }))}
      />
    </section>
  );
}
