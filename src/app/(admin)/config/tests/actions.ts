"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const s = await auth();
  if (!s || s.user.role !== "ADMIN") throw new Error("Unauthorized");
}

const TestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  weight: z.coerce.number().int().min(1).max(20),
  scoreOk: z.coerce.number().int(),
  scoreObs: z.coerce.number().int(),
  scoreFail: z.coerce.number().int(),
  price: z.coerce.number().min(0),
  blocking: z.coerce.boolean(),
  apiEnabled: z.coerce.boolean(),
  apiUrl: z.string().default(""),
  apiKey: z.string().default(""),
  apiMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
});

export async function saveTest(_prev: { error?: string } | null, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  // checkboxes don't send "false" — coerce
  raw.blocking = formData.get("blocking") === "on" ? "true" : "false";
  raw.apiEnabled = formData.get("apiEnabled") === "on" ? "true" : "false";
  const parsed = TestSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const data = parsed.data;
  await db.test.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      weight: data.weight,
      scoreOk: data.scoreOk,
      scoreObs: data.scoreObs,
      scoreFail: data.scoreFail,
      price: data.price,
      blocking: data.blocking,
      apiEnabled: data.apiEnabled,
      apiUrl: data.apiUrl,
      apiKey: data.apiKey,
      apiMethod: data.apiMethod,
    },
  });
  // Sync blocking flag to all level associations
  await db.levelTest.updateMany({
    where: { testId: data.id },
    data: data.blocking ? { blocking: true } : {},
  });
  revalidatePath("/admin/config/tests");
  return null;
}

export async function createTest(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nombre requerido");
  // Find next id (t1, t2, ... t100, ...)
  const max = await db.test.findMany({ select: { id: true } });
  const ns = max
    .map((t) => Number(t.id.replace(/^t/, "")))
    .filter((n) => Number.isFinite(n));
  const next = (ns.length ? Math.max(...ns) : 0) + 1;
  await db.test.create({
    data: {
      id: `t${next}`,
      name,
      description: "",
      weight: 5,
      scoreOk: 100,
      scoreObs: 50,
      scoreFail: -100,
      price: 0,
    },
  });
  revalidatePath("/admin/config/tests");
}

export async function deleteTest(testId: string) {
  await requireAdmin();
  await db.test.delete({ where: { id: testId } });
  revalidatePath("/admin/config/tests");
  revalidatePath("/admin/config/positions");
}
