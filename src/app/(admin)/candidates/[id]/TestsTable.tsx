"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, RefreshCw, Trash2, FileDown, Wand2 } from "lucide-react";
import { TestResultStatus } from "@prisma/client";
import {
  callTestApi,
  removeEvidence,
  setResultNotes,
  setResultStatus,
  uploadEvidence,
} from "./actions";

type Row = {
  testId: string;
  testName: string;
  weight: number;
  blocking: boolean;
  apiEnabled: boolean;
  status: TestResultStatus;
  notes: string;
  contribution: number;
  evidenceName: string | null;
  evidenceUrl: string | null;
};

const STATUS_OPTS: { value: TestResultStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "OK", label: "✅ Sin observaciones" },
  { value: "OBS", label: "⚠️ Con observaciones" },
  { value: "FAIL", label: "❌ No apto" },
];

export function TestsTable({ candidateId, rows }: { candidateId: string; rows: Row[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-text-dim uppercase tracking-[1.5px] text-[9px] border-b border-border bg-surface2">
            <th className="px-4 py-3">Prueba</th>
            <th className="px-4 py-3 w-20 text-right">Peso</th>
            <th className="px-4 py-3 w-52">Resultado</th>
            <th className="px-4 py-3">Observaciones</th>
            <th className="px-4 py-3 w-28 text-center">API</th>
            <th className="px-4 py-3 w-40">Evidencia</th>
            <th className="px-4 py-3 w-24 text-right">Contrib.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <RowEditor key={r.testId} candidateId={candidateId} row={r} pending={pending} start={start} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowEditor({
  candidateId,
  row,
  pending,
  start,
}: {
  candidateId: string;
  row: Row;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const [notes, setNotes] = useState(row.notes);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <tr className="border-b border-border last:border-b-0 align-middle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {row.blocking ? (
            <span className="text-alto" title="Prueba bloqueante">
              🔒
            </span>
          ) : null}
          <span className="text-text">{row.testName}</span>
        </div>
        <div className="text-text-dim text-[10px] mt-0.5 mono">{row.testId}</div>
      </td>
      <td className="px-4 py-3 text-right mono text-text">×{row.weight}</td>
      <td className="px-4 py-3">
        <select
          className="field-select"
          value={row.status}
          disabled={pending}
          onChange={(e) =>
            start(() =>
              setResultStatus(candidateId, row.testId, e.target.value as TestResultStatus),
            )
          }
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          className="field-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== row.notes) start(() => setResultNotes(candidateId, row.testId, notes));
          }}
          placeholder="Notas / hallazgos…"
        />
      </td>
      <td className="px-4 py-3 text-center">
        {row.apiEnabled ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await callTestApi(candidateId, row.testId);
              })
            }
            className="btn btn-ghost btn-sm"
            title="Consultar API"
          >
            <RefreshCw size={11} />
            API
          </button>
        ) : (
          <span className="text-text-dim text-[11px]">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,image/*,.doc,.docx"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            setUploading(true);
            await uploadEvidence(candidateId, row.testId, fd);
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        {row.evidenceUrl ? (
          <div className="flex items-center gap-1">
            <a
              href={row.evidenceUrl}
              target="_blank"
              className="btn btn-ghost btn-sm"
              title={row.evidenceName ?? "Ver evidencia"}
            >
              <FileDown size={11} />
              Ver
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => start(() => removeEvidence(candidateId, row.testId))}
              title="Quitar evidencia"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip size={11} />
            {uploading ? "Subiendo…" : "Subir"}
          </button>
        )}
      </td>
      <td
        className="px-4 py-3 text-right mono"
        style={{
          color:
            row.contribution > 0
              ? "var(--bajo)"
              : row.contribution < 0
                ? "var(--alto)"
                : "var(--text-dim)",
        }}
      >
        {row.contribution > 0 ? "+" : ""}
        {row.contribution}
      </td>
    </tr>
  );
}

export function AISuggestButton({ candidateId }: { candidateId: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn btn-accent"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setResult(null);
          try {
            const r = await fetch("/api/ai/suggest-battery", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ candidateId }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? "Error");
            setResult(j.summary ?? "OK");
          } catch (e) {
            setResult((e as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        <Wand2 size={12} />
        {pending ? "Sugiriendo…" : "Sugerir batería con IA"}
      </button>
      {result ? <span className="text-[11px] text-text-dim">{result}</span> : null}
    </div>
  );
}
