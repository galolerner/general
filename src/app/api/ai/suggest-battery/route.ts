import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAnthropic, AI_MODEL } from "@/lib/ai";
import { computeVerdict, type Verdict } from "@/lib/scoring";

/**
 * POST /api/ai/suggest-battery
 * Body: { candidateId: string } | { positionName: string, levelSlug?: string }
 *
 * Returns:
 *   { suggestedTestIds: string[], reasoning: string, summary: string }
 *
 * Uses prompt caching on the (long, mostly static) system prompt so subsequent calls
 * within the cache TTL pay ~10× less for the cached tokens.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    candidateId?: string;
    positionName?: string;
    levelSlug?: string;
  };

  // 1) Resolve target candidate (and its position)
  let positionName = body.positionName ?? "";
  let levelSlug = body.levelSlug ?? "";
  let candidateId = body.candidateId ?? null;
  if (candidateId) {
    const c = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { level: true },
    });
    if (!c) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    // Client role can only ask about their own candidates
    if (session.user.role === "CLIENT" && c.clientId !== session.user.clientId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    positionName = c.positionName;
    levelSlug = c.level?.slug ?? "";
  }
  if (!positionName)
    return NextResponse.json({ error: "Falta positionName o candidateId" }, { status: 400 });

  // 2) Catalog of available tests (cacheable system context)
  const tests = await db.test.findMany({ orderBy: { id: "asc" } });
  const levels = await db.riskLevel.findMany({
    orderBy: { order: "asc" },
    include: { levelTests: true },
  });

  // 3) Anonymised historical signal: how often each test produced FAIL across
  //    candidates whose positionName matched (substring) the target. Aggregated, no PII.
  const historical = await aggregateHistory(positionName);

  // 4) Build messages
  const sysCacheable = buildSystemPrompt(tests, levels);

  const targetLevel = levels.find((l) => l.slug === levelSlug);
  const userPrompt = `Posición a evaluar: "${positionName}"
Nivel asignado actualmente: ${targetLevel ? `${targetLevel.name} (${targetLevel.slug})` : "no asignado"}

Histórico anonimizado de hallazgos para esta posición (últimos 12 meses):
${
  historical.length === 0
    ? "  (sin datos previos)"
    : historical
        .map(
          (h) =>
            `  - ${h.testName} (${h.testId}): ${h.failRate}% fail · ${h.obsRate}% obs · ${h.total} ejecuciones`,
        )
        .join("\n")
}

Devolveme la batería de pruebas recomendada para este puesto.`;

  const anthropic = getAnthropic();
  const completion = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: sysCacheable,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  // 5) Parse
  const raw = completion.content
    .filter((c): c is Extract<typeof c, { type: "text" }> => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  const parsed = parseSuggestion(raw, tests.map((t) => t.id));
  return NextResponse.json({
    ...parsed,
    summary: `IA sugirió ${parsed.suggestedTestIds.length} pruebas (modelo ${AI_MODEL}).`,
  });
}

function buildSystemPrompt(
  tests: { id: string; name: string; description: string; price: unknown; weight: number; blocking: boolean }[],
  levels: {
    slug: string;
    name: string;
    description: string;
    levelTests: { testId: string; blocking: boolean }[];
  }[],
) {
  return `Sos un asistente experto en background checks para SHIELD Platform (ISEG).
Tu trabajo: dado un puesto laboral concreto, recomendar la batería ÓPTIMA de pruebas
del catálogo configurado, balanceando riesgo del puesto, costo y señales históricas.

CATÁLOGO DE PRUEBAS DISPONIBLES (id · nombre · peso · bloqueante · descripción):
${tests
  .map(
    (t) =>
      `- ${t.id} · ${t.name} · peso ${t.weight} · ${t.blocking ? "BLOQUEANTE" : "no bloqueante"} · ${t.description}`,
  )
  .join("\n")}

NIVELES DE RIESGO Y SU BATERÍA POR DEFECTO:
${levels
  .map(
    (l) =>
      `- ${l.slug} (${l.name}): ${l.description}\n    Default: ${l.levelTests
        .map((lt) => lt.testId + (lt.blocking ? "*" : ""))
        .join(", ")}`,
  )
  .join("\n")}

REGLAS:
1. Siempre incluí t1 (Antecedentes judiciales) y t4 (Shoplifting) para puestos que
   manejen dinero o valores.
2. Para puestos críticos/estratégicos sumá t8 (Polígrafo) y t15 (Patrimonial).
3. No recomiendes más de 16 pruebas por candidato.
4. Si el histórico muestra >25% de fail en una prueba para puestos similares, mantenela.
5. Si el histórico muestra <2% de fail consistentemente, podés omitirla cuando inflé costo.

FORMATO DE RESPUESTA (estricto, JSON puro, nada de markdown):
{
  "suggestedTestIds": ["t1", "t4", ...],
  "reasoning": "máx 4 oraciones explicando por qué"
}`;
}

function parseSuggestion(raw: string, validIds: string[]) {
  const fallback = { suggestedTestIds: ["t1"], reasoning: "Respuesta de la IA no pudo parsearse." };
  // Extract JSON from potential prose
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return fallback;
  try {
    const j = JSON.parse(m[0]) as { suggestedTestIds?: string[]; reasoning?: string };
    const ids = (j.suggestedTestIds ?? []).filter((id) => validIds.includes(id));
    if (ids.length === 0) return fallback;
    return { suggestedTestIds: ids, reasoning: j.reasoning ?? "" };
  } catch {
    return fallback;
  }
}

async function aggregateHistory(positionName: string) {
  if (!positionName) return [];
  const candidates = await db.candidate.findMany({
    where: {
      positionName: { contains: positionName, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
    take: 500,
  });
  if (candidates.length === 0) return [];

  const results = await db.testResult.groupBy({
    by: ["testId", "status"],
    where: { candidateId: { in: candidates.map((c) => c.id) }, status: { not: "PENDING" } },
    _count: { _all: true },
  });

  const byTest: Record<
    string,
    { ok: number; obs: number; fail: number }
  > = {};
  for (const r of results) {
    byTest[r.testId] ??= { ok: 0, obs: 0, fail: 0 };
    if (r.status === "OK") byTest[r.testId].ok += r._count._all;
    else if (r.status === "OBS") byTest[r.testId].obs += r._count._all;
    else if (r.status === "FAIL") byTest[r.testId].fail += r._count._all;
  }

  const tests = await db.test.findMany({
    where: { id: { in: Object.keys(byTest) } },
    select: { id: true, name: true },
  });
  const nameById = Object.fromEntries(tests.map((t) => [t.id, t.name]));

  return Object.entries(byTest).map(([testId, c]) => {
    const total = c.ok + c.obs + c.fail;
    return {
      testId,
      testName: nameById[testId] ?? testId,
      total,
      failRate: total ? Math.round((c.fail / total) * 100) : 0,
      obsRate: total ? Math.round((c.obs / total) * 100) : 0,
    };
  });
}

// Silence unused import warning — kept for future use
void computeVerdict;
void ({} as Verdict);
