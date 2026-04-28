"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { saveClient } from "./actions";

type ClientLite = {
  id: string;
  name: string;
  industry: string;
  icon: string;
  email: string;
};

const ICONS = ["🏢", "🏪", "🏦", "🏭", "🏥", "🏨", "🏛️", "🛡️", "⚙️", "💼"];

export function ClientFormModal({
  mode,
  client,
}: {
  mode: "create" | "edit";
  client?: ClientLite;
}) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(client?.icon ?? "🏢");
  const [state, action, pending] = useActionState(async (prev: { error?: string } | null, fd: FormData) => {
    const r = await saveClient(prev, fd);
    if (!r) setOpen(false);
    return r;
  }, null);

  return (
    <>
      <button
        type="button"
        className={mode === "create" ? "btn btn-accent" : "btn btn-ghost btn-sm"}
        onClick={() => setOpen(true)}
      >
        {mode === "create" ? <Plus size={12} /> : <Pencil size={11} />}
        {mode === "create" ? "Nuevo cliente" : "Editar"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-md p-6">
            <header className="mb-5">
              <p className="eyebrow mb-1">{mode === "create" ? "Nuevo" : "Editar"} cliente</p>
              <h2 className="text-2xl font-light text-text">
                {mode === "create" ? "Alta de cliente" : client?.name}
              </h2>
            </header>

            <form action={action} className="flex flex-col gap-4">
              {client?.id ? <input type="hidden" name="id" value={client.id} /> : null}
              <input type="hidden" name="icon" value={icon} />

              <div className="field">
                <label>Icono</label>
                <div className="flex flex-wrap gap-1">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={
                        "text-xl w-9 h-9 border transition " +
                        (icon === i
                          ? "border-accent bg-[rgba(43,214,197,0.06)]"
                          : "border-border hover:border-border2")
                      }
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Nombre</label>
                <input
                  name="name"
                  required
                  defaultValue={client?.name ?? ""}
                  className="field-input"
                />
              </div>
              <div className="field">
                <label>Industria</label>
                <input
                  name="industry"
                  defaultValue={client?.industry ?? ""}
                  className="field-input"
                />
              </div>
              <div className="field">
                <label>Email de acceso</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={client?.email ?? ""}
                  className="field-input"
                />
              </div>
              <div className="field">
                <label>Contraseña {mode === "edit" ? "(dejar vacío para mantener)" : ""}</label>
                <input
                  name="password"
                  type="password"
                  required={mode === "create"}
                  className="field-input"
                />
              </div>

              {state?.error ? <p className="text-alto text-[11px]">{state.error}</p> : null}

              <footer className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent" disabled={pending}>
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
