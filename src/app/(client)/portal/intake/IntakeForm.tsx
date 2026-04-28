"use client";

import { useActionState, useMemo, useState } from "react";
import { submitIntake } from "./actions";

type Position = {
  id: string;
  name: string;
  levelName: string;
  levelColor: string;
  levelIcon: string;
};

export function IntakeForm({ positions }: { positions: Position[] }) {
  const [state, action, pending] = useActionState(submitIntake, null);
  const [posQuery, setPosQuery] = useState("");
  const [chosenPos, setChosenPos] = useState<Position | null>(null);

  const filtered = useMemo(() => {
    const q = posQuery.trim().toLowerCase();
    if (!q) return positions.slice(0, 30);
    return positions.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30);
  }, [posQuery, positions]);

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="card p-5">
        <legend className="eyebrow px-2">Datos personales</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
          <div className="field">
            <label>Apellidos *</label>
            <input name="lastName" required className="field-input" />
          </div>
          <div className="field">
            <label>Nombres *</label>
            <input name="firstName" required className="field-input" />
          </div>
          <div className="field">
            <label>DNI / Documento *</label>
            <input name="dni" required className="field-input" />
          </div>
          <div className="field">
            <label>Fecha de nacimiento</label>
            <input name="birthdate" type="date" className="field-input" />
          </div>
          <div className="field md:col-span-2">
            <label>Dirección</label>
            <input name="address" className="field-input" />
          </div>
          <div className="field">
            <label>Teléfono</label>
            <input name="phone" className="field-input" />
          </div>
          <div className="field">
            <label>Industria</label>
            <input name="industry" className="field-input" />
          </div>
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="eyebrow px-2">Puesto a evaluar *</legend>
        <input type="hidden" name="positionName" value={chosenPos?.name ?? posQuery} />
        <div className="mt-3">
          <input
            value={chosenPos?.name ?? posQuery}
            onChange={(e) => {
              setPosQuery(e.target.value);
              setChosenPos(null);
            }}
            placeholder="Buscar o tipear el puesto…"
            className="field-input"
            required
          />
          {chosenPos ? (
            <p className="text-[12px] mt-2" style={{ color: chosenPos.levelColor }}>
              {chosenPos.levelIcon} Nivel {chosenPos.levelName}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1 mt-2 max-h-40 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setChosenPos(p)}
                    className="btn btn-ghost btn-sm"
                  >
                    {p.levelIcon} {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-dim text-[11px] mt-3">
            Si el puesto exacto no aparece, podés tipearlo libremente; el sistema lo asignará al
            nivel cuyo nombre más se parezca.
          </p>
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="eyebrow px-2">Redes sociales (opcional)</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
          <div className="field">
            <label>Facebook</label>
            <input name="facebook" className="field-input" />
          </div>
          <div className="field">
            <label>LinkedIn</label>
            <input name="linkedin" className="field-input" />
          </div>
          <div className="field">
            <label>Instagram</label>
            <input name="instagram" className="field-input" />
          </div>
          <div className="field">
            <label>Otra</label>
            <input name="otherSocial" className="field-input" />
          </div>
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="eyebrow px-2">Historial laboral (últimos 3 trabajos)</legend>
        <div className="flex flex-col gap-6 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border pb-5 last:border-b-0 last:pb-0">
              <div className="field md:col-span-2">
                <label>Empresa #{i + 1}</label>
                <input name={`jobs[${i}][company]`} className="field-input" />
              </div>
              <div className="field">
                <label>Cargo</label>
                <input name={`jobs[${i}][position]`} className="field-input" />
              </div>
              <div className="field">
                <label>Inicio (YYYY-MM)</label>
                <input name={`jobs[${i}][start]`} placeholder="2022-03" className="field-input" />
              </div>
              <div className="field">
                <label>Fin (YYYY-MM o "Actual")</label>
                <input name={`jobs[${i}][end]`} placeholder="2024-08" className="field-input" />
              </div>
              <div className="field">
                <label>Motivo de salida</label>
                <input name={`jobs[${i}][reason]`} className="field-input" />
              </div>
              <div className="field">
                <label>Persona de contacto</label>
                <input name={`jobs[${i}][contact]`} className="field-input" />
              </div>
              <div className="field">
                <label>Teléfono contacto</label>
                <input name={`jobs[${i}][contactPhone]`} className="field-input" />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="eyebrow px-2">Observaciones</legend>
        <textarea name="notes" className="field-textarea mt-3" rows={4} />
      </fieldset>

      {state?.error ? <p className="text-alto text-[12px]">{state.error}</p> : null}

      <footer className="flex items-center justify-end gap-2">
        <button type="submit" className="btn btn-accent" disabled={pending}>
          {pending ? "Guardando…" : "Ingresar candidato →"}
        </button>
      </footer>
    </form>
  );
}
