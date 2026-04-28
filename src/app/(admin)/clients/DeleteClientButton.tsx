"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClient } from "./actions";

export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(`¿Eliminar el cliente "${clientName}"?\nSe eliminarán todos sus candidatos y resultados.`)
        )
          return;
        start(() => deleteClient(clientId));
      }}
    >
      <Trash2 size={11} />
    </button>
  );
}
