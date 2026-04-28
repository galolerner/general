"use client";

import { useTransition } from "react";
import { changeCandidateLevel } from "./actions";

type Level = { id: string; name: string; icon: string; color: string };

export function ChangeLevelSelect({
  candidateId,
  levelId,
  levels,
}: {
  candidateId: string;
  levelId: string | null;
  levels: Level[];
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[2px] text-text-dim">
      Nivel
      <select
        className="field-select py-1 text-[12px]"
        value={levelId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          start(() => changeCandidateLevel(candidateId, v));
        }}
      >
        <option value="" disabled>
          —
        </option>
        {levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.icon} {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
