"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { createTest, deleteTest, saveTest } from "./actions";

type ListItem = { id: string; name: string; weight: number; blocking: boolean };
type SelectedTest = {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoreOk: number;
  scoreObs: number;
  scoreFail: number;
  price: number;
  blocking: boolean;
  apiEnabled: boolean;
  apiUrl: string;
  apiKey: string;
  apiMethod: string;
};

export function TestsEditor({
  tests,
  selectedId,
  selected,
  currencySymbol,
}: {
  tests: ListItem[];
  selectedId: string | null;
  selected: SelectedTest | null;
  currencySymbol: string;
}) {
  return (
    <div className="grid grid-cols-[300px_1fr] h-full overflow-hidden min-h-0">
      <aside className="bg-surface border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[9px] font-bold tracking-[3px] uppercase text-accent">
            Catálogo
          </h3>
          <NewTestButton />
        </div>
        <ul>
          {tests.map((t) => {
            const sel = t.id === selectedId;
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/config/tests?id=${t.id}`}
                  className={
                    "block px-4 py-3 border-b border-border transition " +
                    (sel
                      ? "bg-[rgba(43,214,197,0.05)] border-l-2 border-l-accent pl-[14px]"
                      : "hover:bg-surface2")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-text text-[13px] truncate">{t.name}</div>
                    <div className="text-text-dim text-[10px] mono">×{t.weight}</div>
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5 mono">
                    {t.id}
                    {t.blocking ? " · 🔒 bloqueante" : ""}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="overflow-y-auto bg-bg p-6 lg:p-8">
        {selected ? (
          <TestForm key={selected.id} test={selected} currencySymbol={currencySymbol} />
        ) : (
          <p className="text-text-dim">Seleccioná una prueba para editar.</p>
        )}
      </main>
    </div>
  );
}

function NewTestButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        const name = window.prompt("Nombre de la prueba:");
        if (!name?.trim()) return;
        const fd = new FormData();
        fd.set("name", name.trim());
        await createTest(fd);
        router.refresh();
      }}
    >
      <Plus size={11} /> Nueva
    </button>
  );
}

function TestForm({ test, currencySymbol }: { test: SelectedTest; currencySymbol: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveTest, null);

  return (
    <form action={action} className="max-w-3xl">
      <input type="hidden" name="id" value={test.id} />
      <header className="flex items-end justify-between mb-6">
        <div>
          <p className="eyebrow mb-1 mono">{test.id}</p>
          <h1 className="text-3xl font-light text-text">{test.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm(`¿Eliminar "${test.name}"? Se quitará también de los niveles que la usan.`))
                return;
              await deleteTest(test.id);
              router.push("/admin/config/tests");
              router.refresh();
            }}
          >
            <Trash2 size={12} /> Eliminar
          </button>
          <button type="submit" className="btn btn-accent" disabled={pending}>
            <Save size={12} /> {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="field">
          <label>Nombre</label>
          <input name="name" required defaultValue={test.name} className="field-input" />
        </div>
        <div className="field">
          <label>Precio unitario ({currencySymbol})</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={test.price}
            className="field-input"
          />
        </div>
        <div className="field md:col-span-2">
          <label>Descripción</label>
          <textarea
            name="description"
            defaultValue={test.description}
            className="field-textarea"
            rows={3}
          />
        </div>
        <div className="field">
          <label>Peso ({test.weight})</label>
          <input
            name="weight"
            type="range"
            min="1"
            max="20"
            defaultValue={test.weight}
            className="w-full accent-[var(--accent)]"
          />
        </div>
        <div className="field">
          <label>¿Bloqueante?</label>
          <label className="flex items-center gap-2 text-[12px] text-text-mid pt-2">
            <input type="checkbox" name="blocking" defaultChecked={test.blocking} />
            Si falla, el dictamen es automáticamente NO CONTRATAR
          </label>
        </div>
      </div>

      <h3 className="eyebrow mb-3">Puntajes por resultado</h3>
      <div className="grid grid-cols-3 gap-4 mb-7 card p-4">
        <div className="field">
          <label>Sin observaciones</label>
          <input
            name="scoreOk"
            type="number"
            defaultValue={test.scoreOk}
            className="field-input"
          />
        </div>
        <div className="field">
          <label>Con observaciones</label>
          <input
            name="scoreObs"
            type="number"
            defaultValue={test.scoreObs}
            className="field-input"
          />
        </div>
        <div className="field">
          <label>No apto</label>
          <input
            name="scoreFail"
            type="number"
            defaultValue={test.scoreFail}
            className="field-input"
          />
        </div>
      </div>

      <h3 className="eyebrow mb-3">Integración API</h3>
      <div className="card p-4 mb-6">
        <label className="flex items-center gap-2 text-[12px] text-text-mid mb-4">
          <input type="checkbox" name="apiEnabled" defaultChecked={test.apiEnabled} />
          Habilitar consulta automática a una API externa
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="field md:col-span-2">
            <label>URL del endpoint</label>
            <input
              name="apiUrl"
              defaultValue={test.apiUrl}
              placeholder="https://api.proveedor.com/v1/check"
              className="field-input"
            />
          </div>
          <div className="field">
            <label>Método</label>
            <select name="apiMethod" defaultValue={test.apiMethod} className="field-select">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
          </div>
          <div className="field md:col-span-3">
            <label>API Key</label>
            <input
              name="apiKey"
              type="password"
              defaultValue={test.apiKey}
              className="field-input"
            />
          </div>
        </div>
        <p className="text-text-dim text-[11px] mt-3">
          Las llamadas reales a APIs externas se conectarán en fase 2. Hoy el botón “API” en la
          ficha del candidato simula una respuesta para validar el flujo.
        </p>
      </div>

      {state?.error ? <p className="text-alto text-[11px]">{state.error}</p> : null}
    </form>
  );
}
