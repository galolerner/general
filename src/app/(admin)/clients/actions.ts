"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const s = await auth();
  if (!s || s.user.role !== "ADMIN") throw new Error("Unauthorized");
}

const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre requerido"),
  industry: z.string().optional().default(""),
  icon: z.string().min(1).default("🏢"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
});

export async function saveClient(_prev: { error?: string } | null, formData: FormData) {
  await requireAdmin();
  const parsed = ClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  if (data.id) {
    await db.client.update({
      where: { id: data.id },
      data: { name: data.name, industry: data.industry, icon: data.icon },
    });
    // Update primary user's email and password (if provided)
    const primary = await db.user.findFirst({
      where: { clientId: data.id, role: "CLIENT" },
      orderBy: { createdAt: "asc" },
    });
    if (primary) {
      await db.user.update({
        where: { id: primary.id },
        data: {
          email: data.email,
          ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
        },
      });
    }
  } else {
    if (!data.password) return { error: "Contraseña requerida para nuevo cliente" };
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "Ese email ya está registrado" };
    const c = await db.client.create({
      data: { name: data.name, industry: data.industry, icon: data.icon },
    });
    await db.user.create({
      data: {
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        name: data.name,
        role: "CLIENT",
        clientId: c.id,
      },
    });
  }
  revalidatePath("/admin/clients");
  return null;
}

export async function deleteClient(clientId: string) {
  await requireAdmin();
  await db.client.delete({ where: { id: clientId } });
  revalidatePath("/admin/clients");
}
