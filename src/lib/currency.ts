import { db } from "@/lib/db";

export const CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar" },
  PEN: { symbol: "S/", name: "Sol Peruano" },
  MXN: { symbol: "$", name: "Peso Mexicano" },
  CLP: { symbol: "$", name: "Peso Chileno" },
  GTQ: { symbol: "Q", name: "Quetzal" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export async function getCurrency(): Promise<CurrencyCode> {
  const s = await db.setting.findUnique({ where: { key: "currency" } });
  const code = (s?.value ?? "USD") as CurrencyCode;
  return code in CURRENCIES ? code : "USD";
}

export async function setCurrency(code: CurrencyCode) {
  await db.setting.upsert({
    where: { key: "currency" },
    update: { value: code },
    create: { key: "currency", value: code },
  });
}

export function formatMoney(n: number | string, code: CurrencyCode = "USD") {
  const v = typeof n === "string" ? Number(n) : n;
  const sym = CURRENCIES[code]?.symbol ?? "$";
  return `${sym} ${v.toFixed(2)}`;
}

/** Generate next candidate code SH-YYYY-NNNN. */
export async function nextCandidateCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SH-${year}-`;
  const last = await db.candidate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const lastN = last?.code ? Number(last.code.slice(prefix.length)) : 0;
  const next = String(lastN + 1).padStart(4, "0");
  return `${prefix}${next}`;
}
