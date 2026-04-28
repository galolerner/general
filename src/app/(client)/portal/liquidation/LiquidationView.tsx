"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

type Line = {
  candidateId: string;
  candidateCode: string;
  candidateName: string;
  positionName: string;
  testId: string;
  testName: string;
  status: string;
  price: number;
  priceFmt: string;
  date: Date | string;
};

type Data = {
  clientId: string;
  year: number;
  month: number;
  status: "DRAFT" | "ISSUED" | "PAID";
  lines: Line[];
  total: number;
  totalFmt: string;
  testCount: number;
  candidateCount: number;
};

const STATUS_LABEL: Record<Data["status"], { text: string; cls: string }> = {
  DRAFT: { text: "Borrador", cls: "pill-pend" },
  ISSUED: { text: "Emitida", cls: "pill-obs" },
  PAID: { text: "Pagada", cls: "pill-ok" },
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function LiquidationView({
  year,
  month,
  data,
}: {
  year: number;
  month: number;
  data: Data;
}) {
  const router = useRouter();
  function setPeriod(y: number, m: number) {
    const sp = new URLSearchParams({ year: String(y), month: String(m) });
    router.push(`/portal/liquidation?${sp.toString()}`);
  }

  return (
    <section className="px-8 py-8 max-w-6xl mx-auto">
      <header className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="eyebrow mb-1">Facturación</p>
          <h1 className="text-3xl font-light text-text">
            Liquidación · {MONTHS[month - 1]} {year}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={month}
            onChange={(e) => setPeriod(year, Number(e.target.value))}
            className="field-select"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setPeriod(Number(e.target.value), month)}
            className="field-select"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <a
            href={`/api/liquidations/${data.clientId}/${year}/${month}/pdf`}
            className="btn btn-ghost"
          >
            <Download size={12} />
            PDF
          </a>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-7">
        <div className="bg-bg p-5">
          <div className="mono text-3xl font-light text-accent">{data.totalFmt}</div>
          <div className="eyebrow mt-1">Total a facturar</div>
        </div>
        <div className="bg-bg p-5">
          <div className="mono text-3xl font-light text-text">{data.testCount}</div>
          <div className="eyebrow mt-1">Pruebas ejecutadas</div>
        </div>
        <div className="bg-bg p-5">
          <div className="mono text-3xl font-light text-text">{data.candidateCount}</div>
          <div className="eyebrow mt-1">Candidatos</div>
        </div>
        <div className="bg-bg p-5">
          <div className="mt-1">
            <span className={`pill ${STATUS_LABEL[data.status].cls}`}>
              {STATUS_LABEL[data.status].text}
            </span>
          </div>
          <div className="eyebrow mt-2">Estado</div>
        </div>
      </section>

      {data.lines.length === 0 ? (
        <div className="card p-10 text-center text-text-dim">
          No se ejecutaron pruebas en este período.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-text-dim uppercase tracking-[1.5px] text-[9px] border-b border-border bg-surface2">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Candidato</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3">Prueba</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2 text-text-dim mono">
                    {new Date(l.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-text">{l.candidateName}</td>
                  <td className="px-4 py-2 text-accent mono">{l.candidateCode}</td>
                  <td className="px-4 py-2 text-text-mid">{l.positionName || "—"}</td>
                  <td className="px-4 py-2 text-text-mid">{l.testName}</td>
                  <td className="px-4 py-2 text-text-dim">{l.status}</td>
                  <td className="px-4 py-2 text-right text-text mono">{l.priceFmt}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface2">
                <td colSpan={6} className="px-4 py-3 text-right eyebrow">
                  Total
                </td>
                <td className="px-4 py-3 text-right mono text-accent text-lg">{data.totalFmt}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
