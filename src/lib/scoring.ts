import type { TestResultStatus } from "@prisma/client";

export type ScoringTest = {
  testId: string;
  weight: number;
  scoreOk: number;
  scoreObs: number;
  scoreFail: number;
  blocking: boolean;
};

export type ScoringInput = {
  thresholdOk: number;
  thresholdObs: number;
  /** All tests assigned to this candidate's risk level (snapshot). */
  tests: ScoringTest[];
  /** Map of testId → status. Missing = PENDING. */
  results: Record<string, TestResultStatus>;
};

export type Verdict =
  | "OK" // CONTRATAR
  | "OBS" // CONTRATAR CON OBSERVACIONES
  | "NO" // NO CONTRATAR
  | "PEND"; // PENDIENTE

export type Contribution = {
  testId: string;
  weight: number;
  status: TestResultStatus;
  scoreUnit: number; // -100..100
  contribution: number; // weight * scoreUnit
  blocking: boolean;
};

export type ScoringResult = {
  verdict: Verdict;
  score: number; // 0-100
  thresholdOk: number;
  thresholdObs: number;
  blockedBy: string[]; // testIds that triggered NO via blocking failure
  contributions: Contribution[];
  totalWeight: number;
  pendingCount: number;
  evaluatedCount: number;
};

const STATUS_TO_FIELD: Record<TestResultStatus, "scoreOk" | "scoreObs" | "scoreFail" | null> = {
  OK: "scoreOk",
  OBS: "scoreObs",
  FAIL: "scoreFail",
  PENDING: null,
};

/** Server-side mirror of the mockup's `computeVerdict()`. */
export function computeVerdict(input: ScoringInput): ScoringResult {
  const { tests, results, thresholdOk, thresholdObs } = input;
  const blockedBy: string[] = [];
  const contributions: Contribution[] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  let pendingCount = 0;
  let evaluatedCount = 0;

  for (const t of tests) {
    const status = (results[t.testId] ?? "PENDING") as TestResultStatus;
    totalWeight += t.weight;

    const field = STATUS_TO_FIELD[status];
    if (status === "FAIL" && t.blocking) blockedBy.push(t.testId);

    if (status === "PENDING") {
      pendingCount++;
      contributions.push({
        testId: t.testId,
        weight: t.weight,
        status,
        scoreUnit: 0,
        contribution: 0,
        blocking: t.blocking,
      });
      continue;
    }

    evaluatedCount++;
    const unit = field ? t[field] : 0;
    weightedSum += unit * t.weight;
    contributions.push({
      testId: t.testId,
      weight: t.weight,
      status,
      scoreUnit: unit,
      contribution: unit * t.weight,
      blocking: t.blocking,
    });
  }

  // Normalise to 0-100. Weighted sum range is [-100*W, 100*W].
  const raw = totalWeight > 0 ? (weightedSum / totalWeight + 100) / 2 : 0;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let verdict: Verdict;
  if (evaluatedCount === 0) verdict = "PEND";
  else if (blockedBy.length > 0) verdict = "NO";
  else if (score >= thresholdOk) verdict = "OK";
  else if (score >= thresholdObs) verdict = "OBS";
  else verdict = "NO";

  return {
    verdict,
    score,
    thresholdOk,
    thresholdObs,
    blockedBy,
    contributions,
    totalWeight,
    pendingCount,
    evaluatedCount,
  };
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  OK: "CONTRATAR",
  OBS: "CONTRATAR CON OBSERVACIONES",
  NO: "NO CONTRATAR",
  PEND: "PENDIENTE",
};
