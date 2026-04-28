"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { bulkIntake } from "./actions";

type Row = Record<string, string>;

export function BulkIntakeForm() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        h
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, ""),
      complete: ({ data, errors }) => {
        if (errors.length) {
          setError(errors.map((e) => e.message).join("; "));
          return;
        }
        setRows(data as Row[]);
      },
    });
  }

  function submit() {
    if (!rows.length) return;
    start(async () => {
      const r = await bulkIntake(rows);
      setResult(r);
      if (r.created > 0) setRows([]);
    });
  }

  return (
    <div className="card p-5">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-border2 p-10 cursor-pointer hover:border-accent transition">
        <Upload size={28} className="text-text-dim mb-3" />
        <span className="text-text font-bold">Click para elegir CSV</span>
        <span className="text-text-dim text-[11px] mt-1">o arrastrá el archivo aquí</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {error ? <p className="text-alto text-[12px] mt-3">{error}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-6">
          <p className="eyebrow mb-2">Vista previa ({rows.length} filas)</p>
          <div className="overflow-x-auto card">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-text-dim uppercase tracking-[1px] text-[9px] border-b border-border">
                  {Object.keys(rows[0]).map((k) => (
                    <th key={k} className="px-3 py-2 whitespace-nowrap">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    {Object.keys(rows[0]).map((k) => (
                      <td key={k} className="px-3 py-2 whitespace-nowrap text-text-mid">
                        {r[k] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 8 ? (
            <p className="text-text-dim text-[11px] mt-2">+ {rows.length - 8} filas más…</p>
          ) : null}

          <div className="flex justify-end mt-5">
            <button type="button" disabled={pending} className="btn btn-accent" onClick={submit}>
              {pending ? "Importando…" : `Importar ${rows.length} candidato(s)`}
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 card p-4">
          <p className="text-bajo font-bold">
            ✓ {result.created} candidato{result.created === 1 ? "" : "s"} creado
            {result.created === 1 ? "" : "s"}.
          </p>
          {result.errors.length ? (
            <>
              <p className="text-alto text-[12px] mt-2">Errores:</p>
              <ul className="text-text-dim text-[11px] mt-1 list-disc pl-5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
