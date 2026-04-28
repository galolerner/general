"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Verdict } from "@/lib/scoring";
import { VerdictPill } from "@/components/VerdictPill";

type Item = {
  id: string;
  code: string;
  name: string;
  position: string;
  clientName: string;
  clientIcon: string;
  levelColor: string;
  levelName: string;
  verdict: Verdict;
  score: number;
};

type Filter = "all" | "ok" | "obs" | "no";

const HASHED_COLORS = ["#2bd6c5", "#60a0e0", "#a78bfa", "#f59e0b", "#ef4444", "#22c55e"];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return HASHED_COLORS[Math.abs(h) % HASHED_COLORS.length];
}

function initials(name: string) {
  const parts = name.replace(/,/g, "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function CandidatesSidebar({ items }: { items: Item[] }) {
  const params = useParams<{ id?: string }>();
  const selectedId = params?.id;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== "all") {
        const map: Record<Exclude<Filter, "all">, Verdict> = {
          ok: "OK",
          obs: "OBS",
          no: "NO",
        };
        if (it.verdict !== map[filter]) return false;
      }
      if (!ql) return true;
      return (
        it.name.toLowerCase().includes(ql) ||
        it.code.toLowerCase().includes(ql) ||
        it.position.toLowerCase().includes(ql) ||
        it.clientName.toLowerCase().includes(ql)
      );
    });
  }, [items, q, filter]);

  return (
    <aside className="bg-surface border-r border-border flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-border flex flex-col gap-3">
        <h3 className="font-bold text-[9px] tracking-[3px] uppercase text-accent">
          Candidatos
        </h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nombre, código, puesto…"
          className="search-input w-full bg-transparent border-b border-border text-text px-0 py-2 text-[12px] outline-none focus:border-accent transition"
        />
        <div className="flex gap-1">
          {(["all", "ok", "obs", "no"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "flex-1 px-2 py-1.5 text-[9px] font-bold tracking-[1px] uppercase border transition " +
                (filter === f ? activeCls(f) : "border-border text-text-dim hover:text-text")
              }
            >
              {labelFor(f)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-dim leading-[1.5]">
          📥 Los candidatos los ingresa el cliente desde su portal.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-text-dim text-[12px]">Sin resultados.</div>
        ) : (
          filtered.map((c) => {
            const sel = c.id === selectedId;
            return (
              <Link
                key={c.id}
                href={`/admin/candidates/${c.id}`}
                className={
                  "block px-4 py-2.5 border-b border-border transition relative " +
                  (sel
                    ? "bg-[rgba(43,214,197,0.05)] border-l-2 border-l-accent pl-[14px]"
                    : "hover:bg-surface2")
                }
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: colorFor(c.name) }}
                  >
                    <span style={{ color: "#080a0d" }}>{initials(c.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-text truncate">{c.name}</div>
                    <div className="text-[10px] text-text-dim truncate">
                      {c.code} · {c.position}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: c.levelColor }}>
                      {c.clientIcon} {c.clientName} · {c.levelName}
                    </div>
                  </div>
                  <VerdictPill verdict={c.verdict} />
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-border text-[10px] text-text-dim leading-[1.4]">
        Cuando un cliente carga un candidato desde su portal aparece acá automáticamente.
      </div>
    </aside>
  );
}

function labelFor(f: Filter) {
  return f === "all" ? "Todos" : f === "ok" ? "Contratar" : f === "obs" ? "Obs." : "No apto";
}
function activeCls(f: Filter) {
  if (f === "all") return "border-text-mid text-text bg-surface2";
  if (f === "ok") return "border-bajo text-bajo bg-[rgba(34,197,94,0.1)]";
  if (f === "obs") return "border-accent text-accent bg-[rgba(43,214,197,0.06)]";
  return "border-alto text-alto bg-[rgba(239,68,68,0.1)]";
}
