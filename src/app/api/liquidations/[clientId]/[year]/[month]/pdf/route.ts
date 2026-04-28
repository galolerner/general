import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcLiquidation } from "@/lib/liquidation";
import { CURRENCIES, formatMoney, getCurrency } from "@/lib/currency";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ clientId: string; year: string; month: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId, year, month } = await ctx.params;

  if (session.user.role === "CLIENT" && session.user.clientId !== clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const liq = await calcLiquidation(clientId, Number(year), Number(month));
  const currency = await getCurrency();
  const symbol = CURRENCIES[currency].symbol;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("SHIELD — Liquidación mensual", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(`${client.name} · ${month.padStart(2, "0")}/${year}`, 14, 26);
  doc.setTextColor(0);

  doc.setFontSize(13);
  doc.text(`Total: ${formatMoney(liq.total, currency)}`, 14, 38);
  doc.setFontSize(10);
  doc.text(
    `${liq.testCount} pruebas · ${liq.candidateCount} candidatos · estado ${liq.status}`,
    14,
    45,
  );

  autoTable(doc, {
    startY: 52,
    head: [["Fecha", "Candidato", "Código", "Puesto", "Prueba", "Estado", `Importe (${symbol})`]],
    body: liq.lines.map((l) => [
      l.date.toLocaleDateString(),
      l.candidateName,
      l.candidateCode,
      l.positionName,
      l.testName,
      l.status,
      l.price.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 17, 23], textColor: [43, 214, 197] },
  });

  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="liquidacion-${client.name}-${year}-${month}.pdf"`,
    },
  });
}
