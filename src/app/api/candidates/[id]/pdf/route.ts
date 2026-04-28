import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { auth } from "@/lib/auth";
import { loadCandidate } from "@/lib/candidates";
import { VERDICT_LABELS } from "@/lib/scoring";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const c = await loadCandidate(id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "CLIENT" && c.clientId !== session.user.clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("SHIELD — Ficha de candidato", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(c.code, 14, 25);

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text(`${c.lastName}, ${c.firstName}`, 14, 36);
  doc.setFontSize(10);
  doc.text(`Cliente: ${c.client.name}`, 14, 43);
  doc.text(`Puesto: ${c.positionName || "—"}`, 14, 49);
  doc.text(`DNI: ${c.dni}`, 14, 55);
  doc.text(`Fecha: ${c.date.toLocaleDateString()}`, 14, 61);

  const v = c.verdict;
  doc.setFontSize(13);
  doc.text(`Score: ${v?.score ?? "—"} / 100`, 14, 73);
  doc.text(`Dictamen: ${VERDICT_LABELS[v?.verdict ?? "PEND"]}`, 14, 81);

  autoTable(doc, {
    startY: 90,
    head: [["Prueba", "Peso", "Resultado", "Notas"]],
    body: c.levelTests.map((lt) => {
      const r = c.results.find((rr) => rr.testId === lt.testId);
      return [
        lt.test.name,
        String(lt.test.weight),
        r?.status ?? "PENDING",
        r?.notes ?? "",
      ];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [13, 17, 23], textColor: [43, 214, 197] },
  });

  if (c.notes) {
    const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
    doc.setFontSize(11);
    doc.text("Observaciones", 14, y + 12);
    doc.setFontSize(9);
    const split = doc.splitTextToSize(c.notes, 180);
    doc.text(split, 14, y + 18);
  }

  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${c.code}.pdf"`,
    },
  });
}
