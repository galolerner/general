import { loadCandidates } from "@/lib/candidates";
import { CandidatesSidebar } from "./CandidatesSidebar";

export const dynamic = "force-dynamic";

export default async function CandidatesLayout({ children }: { children: React.ReactNode }) {
  const candidates = await loadCandidates();
  const items = candidates.map((c) => ({
    id: c.id,
    code: c.code,
    name: `${c.lastName}, ${c.firstName}`,
    position: c.positionName || "—",
    clientName: c.client.name,
    clientIcon: c.client.icon,
    levelColor: c.level?.color ?? "var(--text-dim)",
    levelName: c.level?.name ?? "—",
    verdict: c.verdict?.verdict ?? "PEND",
    score: c.verdict?.score ?? 0,
  }));

  return (
    <div className="grid grid-cols-[300px_1fr] h-full overflow-hidden min-h-0">
      <CandidatesSidebar items={items} />
      <div className="overflow-y-auto bg-bg">{children}</div>
    </div>
  );
}
