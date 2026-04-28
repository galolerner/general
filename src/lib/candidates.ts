import { db } from "@/lib/db";
import { computeVerdict, type ScoringResult } from "@/lib/scoring";

export type CandidateWithVerdict = Awaited<ReturnType<typeof loadCandidates>>[number];

export async function loadCandidates(filter?: { clientId?: string }) {
  const candidates = await db.candidate.findMany({
    where: filter?.clientId ? { clientId: filter.clientId } : undefined,
    include: {
      client: { select: { id: true, name: true, icon: true } },
      level: true,
      results: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // For each candidate we need its level's LevelTests to score correctly.
  const levelIds = Array.from(new Set(candidates.map((c) => c.levelId).filter(Boolean) as string[]));
  const levelTests = await db.levelTest.findMany({
    where: { levelId: { in: levelIds } },
    include: { test: true },
  });
  const ltByLevel = levelTests.reduce<Record<string, typeof levelTests>>((acc, lt) => {
    (acc[lt.levelId] ??= []).push(lt);
    return acc;
  }, {});

  return candidates.map((c) => {
    const lts = c.levelId ? ltByLevel[c.levelId] ?? [] : [];
    const verdict: ScoringResult | null = c.level
      ? computeVerdict({
          thresholdOk: c.level.thresholdOk,
          thresholdObs: c.level.thresholdObs,
          tests: lts.map((lt) => ({
            testId: lt.testId,
            weight: lt.test.weight,
            scoreOk: lt.test.scoreOk,
            scoreObs: lt.test.scoreObs,
            scoreFail: lt.test.scoreFail,
            blocking: lt.blocking,
          })),
          results: c.results.reduce<Record<string, (typeof c.results)[number]["status"]>>(
            (acc, r) => {
              acc[r.testId] = r.status;
              return acc;
            },
            {},
          ),
        })
      : null;
    return { ...c, verdict };
  });
}

export async function loadCandidate(id: string) {
  const c = await db.candidate.findUnique({
    where: { id },
    include: {
      client: true,
      level: true,
      jobs: { orderBy: { id: "asc" } },
      results: { include: { test: true } },
    },
  });
  if (!c) return null;

  const lts = c.levelId
    ? await db.levelTest.findMany({
        where: { levelId: c.levelId },
        include: { test: true },
        orderBy: { test: { id: "asc" } },
      })
    : [];

  const verdict = c.level
    ? computeVerdict({
        thresholdOk: c.level.thresholdOk,
        thresholdObs: c.level.thresholdObs,
        tests: lts.map((lt) => ({
          testId: lt.testId,
          weight: lt.test.weight,
          scoreOk: lt.test.scoreOk,
          scoreObs: lt.test.scoreObs,
          scoreFail: lt.test.scoreFail,
          blocking: lt.blocking,
        })),
        results: c.results.reduce<Record<string, (typeof c.results)[number]["status"]>>(
          (acc, r) => {
            acc[r.testId] = r.status;
            return acc;
          },
          {},
        ),
      })
    : null;

  return { ...c, levelTests: lts, verdict };
}
