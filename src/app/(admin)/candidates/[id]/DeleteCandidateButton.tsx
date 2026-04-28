"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCandidate } from "./actions";

export function DeleteCandidateButton({ candidateId }: { candidateId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este candidato y todos sus resultados?")) return;
        start(() => deleteCandidate(candidateId));
      }}
      className="btn btn-danger"
    >
      <Trash2 size={12} />
      Eliminar
    </button>
  );
}
