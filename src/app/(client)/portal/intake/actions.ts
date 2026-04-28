"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nextCandidateCode } from "@/lib/currency";

async function requireClient() {
  const s = await auth();
  if (!s || s.user.role !== "CLIENT" || !s.user.clientId) throw new Error("Unauthorized");
  return s.user.clientId;
}

const IntakeSchema = z.object({
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  dni: z.string().min(1),
  birthdate: z.string().optional(),
  address: z.string().optional().default(""),
  positionName: z.string().min(1),
  industry: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  otherSocial: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

const JobSchema = z
  .object({
    company: z.string().optional().default(""),
    position: z.string().optional().default(""),
    start: z.string().optional().default(""),
    end: z.string().optional().default(""),
    contact: z.string().optional().default(""),
    contactPhone: z.string().optional().default(""),
    reason: z.string().optional().default(""),
  })
  .refine((j) => j.company.trim() !== "" || j.position.trim() !== "", {
    message: "skip",
  });

export async function submitIntake(_prev: { error?: string } | null, formData: FormData) {
  const clientId = await requireClient();
  const raw = Object.fromEntries(formData);
  const parsed = IntakeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  // Detect risk level from positionName by matching against existing Position rows.
  const allPositions = await db.position.findMany({ include: { level: true } });
  const positionLower = data.positionName.toLowerCase();
  const matchedPosition = allPositions.find(
    (p) =>
      p.name.toLowerCase() === positionLower ||
      positionLower.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(positionLower),
  );

  const code = await nextCandidateCode();

  const jobs: ReturnType<typeof JobSchema.safeParse>[] = [];
  for (let i = 0; i < 3; i++) {
    const j = JobSchema.safeParse({
      company: formData.get(`jobs[${i}][company]`),
      position: formData.get(`jobs[${i}][position]`),
      start: formData.get(`jobs[${i}][start]`),
      end: formData.get(`jobs[${i}][end]`),
      contact: formData.get(`jobs[${i}][contact]`),
      contactPhone: formData.get(`jobs[${i}][contactPhone]`),
      reason: formData.get(`jobs[${i}][reason]`),
    });
    jobs.push(j);
  }

  const created = await db.candidate.create({
    data: {
      code,
      lastName: data.lastName,
      firstName: data.firstName,
      dni: data.dni,
      birthdate: data.birthdate ? new Date(data.birthdate) : null,
      address: data.address,
      positionName: data.positionName,
      industry: data.industry,
      phone: data.phone,
      facebook: data.facebook,
      linkedin: data.linkedin,
      instagram: data.instagram,
      otherSocial: data.otherSocial,
      notes: data.notes,
      clientId,
      levelId: matchedPosition?.levelId ?? null,
      jobs: {
        create: jobs
          .filter((j): j is Extract<typeof j, { success: true }> => j.success)
          .map((j) => j.data),
      },
    },
  });

  revalidatePath("/portal");
  redirect(`/portal/candidate/${created.id}`);
}
