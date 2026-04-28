"use client";

import { useState, useTransition } from "react";
import { Plus, X, Lock, Unlock } from "lucide-react";
import {
  addPosition,
  removePosition,
  setLevelTestBlocking,
  toggleLevelTest,
  updateLevelDescription,
  updateLevelThresholds,
} from "./actions";

type Level = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  thresholdOk: number;
  thresholdObs: number;
  positions: { id: string; name: string }[];
  tests: { id: string; name: string; weight: number; blocking: boolean }[];
};

export function LevelCard({
  level,
  allTests,
}: {
  level: Level;
  allTests: { id: string; name: string; weight: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [thresholdOk, setThOk] = useState(level.thresholdOk);
  const [thresholdObs, setThObs] = useState(level.thresholdObs);
  const [, start] = useTransition();
  const [showAssign, setShowAssign] = useState(false);
  const [newPos, setNewPos] = useState("");

  const blockingCount = level.tests.filter((t) => t.blocking).length;

  const presentIds = new Set(level.tests.map((t) => t.id));
  const filteredAvailable = allTests.filter((t) => !presentIds.has(t.id));

  return (
    <article className="card overflow-hidden">
      <header
        className="px-5 py-4 cursor-pointer flex items-center gap-4"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="text-3xl">{level.icon}</div>
        <div className="flex-1">
          <h2 className="font-bold text-text" style={{ color: level.color }}>
            Nivel {level.name}
          </h2>
          <p className="text-text-dim text-[12px]">
            {level.positions.length} puestos · {level.tests.length} pruebas · {blockingCount}{" "}
            bloqueantes
          </p>
        </div>
        <div className="text-right text-[11px] text-text-dim">
          Contratar ≥ {level.thresholdOk}% · Obs. ≥ {level.thresholdObs}%
        </div>
        <div className="text-text-dim text-2xl ml-2 select-none">{open ? "−" : "+"}</div>
      </header>

      {open ? (
        <div className="px-5 pb-5 border-t border-border pt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description + thresholds */}
          <div>
            <label className="eyebrow block mb-2">Descripción</label>
            <textarea
              defaultValue={level.description}
              rows={3}
              className="field-textarea"
              onBlur={(e) =>
                start(() => updateLevelDescription(level.id, e.target.value))
              }
            />

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="field">
                <label>Umbral CONTRATAR (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholdOk}
                  onChange={(e) => setThOk(Number(e.target.value))}
                  onBlur={() =>
                    start(() => updateLevelThresholds(level.id, thresholdOk, thresholdObs))
                  }
                  className="field-input"
                />
              </div>
              <div className="field">
                <label>Umbral CON OBS. (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={thresholdObs}
                  onChange={(e) => setThObs(Number(e.target.value))}
                  onBlur={() =>
                    start(() => updateLevelThresholds(level.id, thresholdOk, thresholdObs))
                  }
                  className="field-input"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="eyebrow block mb-2">Puestos</label>
              <ul className="flex flex-wrap gap-2 mb-3">
                {level.positions.map((p) => (
                  <li
                    key={p.id}
                    className="inline-flex items-center gap-2 border border-border px-2.5 py-1 text-[12px] text-text-mid"
                  >
                    {p.name}
                    <button
                      type="button"
                      className="text-text-dim hover:text-alto"
                      onClick={() => start(() => removePosition(p.id))}
                      title="Quitar"
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPos.trim()) return;
                  start(async () => {
                    await addPosition(level.id, newPos);
                    setNewPos("");
                  });
                }}
                className="flex gap-2"
              >
                <input
                  value={newPos}
                  onChange={(e) => setNewPos(e.target.value)}
                  placeholder="Agregar puesto…"
                  className="field-input flex-1"
                />
                <button type="submit" className="btn btn-ghost btn-sm">
                  <Plus size={11} /> Agregar
                </button>
              </form>
            </div>
          </div>

          {/* Tests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="eyebrow">Batería de pruebas</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAssign((s) => !s)}
              >
                <Plus size={11} /> Asignar
              </button>
            </div>
            <ul className="flex flex-col">
              {level.tests.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-b-0"
                >
                  <span className="text-text text-[13px] flex-1">{t.name}</span>
                  <span className="text-text-dim text-[10px] mono">×{t.weight}</span>
                  <button
                    type="button"
                    className={
                      "btn btn-sm " + (t.blocking ? "btn-danger" : "btn-ghost")
                    }
                    onClick={() =>
                      start(() => setLevelTestBlocking(level.id, t.id, !t.blocking))
                    }
                    title={t.blocking ? "Quitar bloqueante" : "Marcar como bloqueante"}
                  >
                    {t.blocking ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => start(() => toggleLevelTest(level.id, t.id, false))}
                    title="Quitar prueba"
                  >
                    <X size={11} />
                  </button>
                </li>
              ))}
            </ul>
            {showAssign ? (
              <div className="mt-3 card p-3">
                <p className="text-text-dim text-[11px] mb-2">Pruebas disponibles:</p>
                <div className="flex flex-wrap gap-1">
                  {filteredAvailable.length === 0 ? (
                    <span className="text-text-dim text-[11px]">
                      Todas las pruebas ya están asignadas a este nivel.
                    </span>
                  ) : (
                    filteredAvailable.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className="btn btn-ghost btn-sm"
                        onClick={() => start(() => toggleLevelTest(level.id, t.id, true))}
                      >
                        + {t.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
