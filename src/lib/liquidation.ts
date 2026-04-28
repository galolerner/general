import { db } from "@/lib/db";
import { LiquidationStatus } from "@prisma/client";

export type LiquidationLine = {
  candidateId: string;
  candidateCode: string;
  candidateName: string;
  positionName: string;
  testId: string;
  testName: string;
  status: string;
  price: number;
  date: Date;
};

export type LiquidationData = {
  clientId: string;
  year: number;
  month: number;
  status: LiquidationStatus;
  lines: LiquidationLine[];
  total: number;
  testCount: number;
  candidateCount: number;
};

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1); // exclusive
  return { from, to };
}

export async function calcLiquidation(
  clientId: string,
  year: number,
  month: number,
): Promise<LiquidationData> {
  const { from, to } = monthRange(year, month);

  const results = await db.testResult.findMany({
    where: {
      candidate: { clientId },
      createdAt: { gte: from, lt: to },
      status: { not: "PENDING" }, // only billable when actually executed
    },
    include: { test: true, candidate: true },
    orderBy: { createdAt: "asc" },
  });

  const lines: LiquidationLine[] = results.map((r) => ({
    candidateId: r.candidateId,
    candidateCode: r.candidate.code,
    candidateName: `${r.candidate.lastName}, ${r.candidate.firstName}`,
    positionName: r.candidate.positionName,
    testId: r.testId,
    testName: r.test.name,
    status: r.status,
    price: Number(r.priceSnapshot),
    date: r.createdAt,
  }));

  const total = lines.reduce((s, l) => s + l.price, 0);
  const candidateIds = new Set(lines.map((l) => l.candidateId));

  const liq = await db.liquidation.findUnique({
    where: { clientId_year_month: { clientId, year, month } },
  });

  return {
    clientId,
    year,
    month,
    status: liq?.status ?? "DRAFT",
    lines,
    total,
    testCount: lines.length,
    candidateCount: candidateIds.size,
  };
}

export async function setLiquidationStatus(
  clientId: string,
  year: number,
  month: number,
  status: LiquidationStatus,
) {
  await db.liquidation.upsert({
    where: { clientId_year_month: { clientId, year, month } },
    update: { status },
    create: { clientId, year, month, status },
  });
}
