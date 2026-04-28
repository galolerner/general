import { db } from "@/lib/db";
import { getCurrency, CURRENCIES } from "@/lib/currency";
import { TestsEditor } from "./TestsEditor";

export const dynamic = "force-dynamic";

export default async function ConfigTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const tests = await db.test.findMany({ orderBy: { id: "asc" } });
  const currency = await getCurrency();
  const selectedId = id ?? tests[0]?.id ?? null;
  const selected = selectedId ? tests.find((t) => t.id === selectedId) ?? null : null;
  return (
    <TestsEditor
      tests={tests.map((t) => ({
        id: t.id,
        name: t.name,
        weight: t.weight,
        blocking: t.blocking,
      }))}
      selectedId={selectedId}
      selected={
        selected
          ? {
              id: selected.id,
              name: selected.name,
              description: selected.description,
              weight: selected.weight,
              scoreOk: selected.scoreOk,
              scoreObs: selected.scoreObs,
              scoreFail: selected.scoreFail,
              price: Number(selected.price),
              blocking: selected.blocking,
              apiEnabled: selected.apiEnabled,
              apiUrl: selected.apiUrl,
              apiKey: selected.apiKey,
              apiMethod: selected.apiMethod,
            }
          : null
      }
      currencySymbol={CURRENCIES[currency].symbol}
    />
  );
}
