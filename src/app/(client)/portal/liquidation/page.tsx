import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { calcLiquidation } from "@/lib/liquidation";
import { getCurrency, formatMoney } from "@/lib/currency";
import { LiquidationView } from "./LiquidationView";

export const dynamic = "force-dynamic";

export default async function ClientLiquidationPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user.clientId) redirect("/login");
  const sp = await searchParams;

  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const [liq, currency] = await Promise.all([
    calcLiquidation(session.user.clientId, year, month),
    getCurrency(),
  ]);

  return (
    <LiquidationView
      year={year}
      month={month}
      data={{
        ...liq,
        lines: liq.lines.map((l) => ({ ...l, priceFmt: formatMoney(l.price, currency) })),
        totalFmt: formatMoney(liq.total, currency),
      }}
    />
  );
}
