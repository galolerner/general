"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nextCandidateCode } from "@/lib/currency";

const FIELD_ALIASES: Record<string, string[]> = {
  lastName: ["apellidos", "lastname", "apellido"],
  firstName: ["nombres", "firstname", "nombre"],
  dni: ["dni", "documento", "doc"],
  positionName: ["puesto", "cargo", "position"],
  industry: ["industria", "industry"],
  phone: ["telefono", "phone"],
  address: ["direccion", "address"],
  notes: ["observaciones", "notas", "notes"],
};

function pickField(row: Record<string, string>, names: string[]): string {
  for (const n of names) {
    const v = row[n];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export async function bulkIntake(rows: Record<string, string>[]) {
  const s = await auth();
  if (!s || s.user.role !== "CLIENT" || !s.user.clientId) throw new Error("Unauthorized");
  const clientId = s.user.clientId;

  const positions = await db.position.findMany({ include: { level: true } });

  const errors: string[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const data = {
      lastName: pickField(row, FIELD_ALIASES.lastName),
      firstName: pickField(row, FIELD_ALIASES.firstName),
      dni: pickField(row, FIELD_ALIASES.dni),
      positionName: pickField(row, FIELD_ALIASES.positionName),
      industry: pickField(row, FIELD_ALIASES.industry),
      phone: pickField(row, FIELD_ALIASES.phone),
      address: pickField(row, FIELD_ALIASES.address),
      notes: pickField(row, FIELD_ALIASES.notes),
    };

    if (!data.lastName || !data.firstName || !data.dni || !data.positionName) {
      errors.push(`Fila ${i + 2}: faltan apellidos/nombres/dni/puesto`);
      continue;
    }

    const positionLower = data.positionName.toLowerCase();
    const matched = positions.find(
      (p) =>
        p.name.toLowerCase() === positionLower ||
        p.name.toLowerCase().includes(positionLower) ||
        positionLower.includes(p.name.toLowerCase()),
    );

    try {
      const code = await nextCandidateCode();
      await db.candidate.create({
        data: {
          code,
          lastName: data.lastName,
          firstName: data.firstName,
          dni: data.dni,
          positionName: data.positionName,
          industry: data.industry,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          clientId,
          levelId: matched?.levelId ?? null,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
    }
  }

  revalidatePath("/portal");
  return { created, errors };
}
