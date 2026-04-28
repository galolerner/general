"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TestResultStatus } from "@prisma/client";

async function requireAdmin() {
  const s = await auth();
  if (!s || s.user.role !== "ADMIN") throw new Error("Unauthorized");
  return s;
}

export async function setResultStatus(
  candidateId: string,
  testId: string,
  status: TestResultStatus,
) {
  await requireAdmin();
  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test) throw new Error("Test not found");
  await db.testResult.upsert({
    where: { candidateId_testId: { candidateId, testId } },
    update: { status },
    create: {
      candidateId,
      testId,
      status,
      priceSnapshot: test.price,
      blockingSnapshot: test.blocking,
      weightSnapshot: test.weight,
    },
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
}

export async function setResultNotes(
  candidateId: string,
  testId: string,
  notes: string,
) {
  await requireAdmin();
  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test) throw new Error("Test not found");
  await db.testResult.upsert({
    where: { candidateId_testId: { candidateId, testId } },
    update: { notes },
    create: {
      candidateId,
      testId,
      notes,
      priceSnapshot: test.price,
      blockingSnapshot: test.blocking,
      weightSnapshot: test.weight,
    },
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
}

export async function callTestApi(candidateId: string, testId: string) {
  await requireAdmin();
  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test) throw new Error("Test not found");
  if (!test.apiEnabled) {
    return { ok: false, message: "API no habilitada para esta prueba." };
  }
  // MOCK: in fase 2 this would actually fetch test.apiUrl with test.apiKey/apiParams.
  // For MVP we record a simulated response and a randomised resolved status.
  const r = Math.random();
  const status: TestResultStatus = r > 0.85 ? "FAIL" : r > 0.6 ? "OBS" : "OK";
  await db.testResult.upsert({
    where: { candidateId_testId: { candidateId, testId } },
    update: {
      status,
      apiStatus: "ok",
      apiResponse: JSON.stringify({ simulated: true, at: new Date().toISOString(), result: status }),
    },
    create: {
      candidateId,
      testId,
      status,
      apiStatus: "ok",
      apiResponse: JSON.stringify({ simulated: true, at: new Date().toISOString(), result: status }),
      priceSnapshot: test.price,
      blockingSnapshot: test.blocking,
      weightSnapshot: test.weight,
    },
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
  return { ok: true, status };
}

export async function uploadEvidence(
  candidateId: string,
  testId: string,
  formData: FormData,
) {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file");

  // MVP: write to /public/uploads/<candidateId>/. Swap for S3/Supabase Storage in prod.
  const dir = path.join(process.cwd(), "public", "uploads", candidateId);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const safeName = `${testId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buf);
  const publicUrl = `/uploads/${candidateId}/${safeName}`;

  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test) throw new Error("Test not found");

  await db.testResult.upsert({
    where: { candidateId_testId: { candidateId, testId } },
    update: {
      evidenceName: file.name,
      evidenceUrl: publicUrl,
      evidenceSize: file.size,
      evidenceType: file.type,
      evidenceUploadedAt: new Date(),
    },
    create: {
      candidateId,
      testId,
      evidenceName: file.name,
      evidenceUrl: publicUrl,
      evidenceSize: file.size,
      evidenceType: file.type,
      evidenceUploadedAt: new Date(),
      priceSnapshot: test.price,
      blockingSnapshot: test.blocking,
      weightSnapshot: test.weight,
    },
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
}

export async function removeEvidence(candidateId: string, testId: string) {
  await requireAdmin();
  const r = await db.testResult.findUnique({
    where: { candidateId_testId: { candidateId, testId } },
  });
  if (r?.evidenceUrl) {
    const filePath = path.join(process.cwd(), "public", r.evidenceUrl);
    try {
      await unlink(filePath);
    } catch {
      /* ignore — file may have been moved already */
    }
  }
  await db.testResult.update({
    where: { candidateId_testId: { candidateId, testId } },
    data: {
      evidenceName: null,
      evidenceUrl: null,
      evidenceSize: null,
      evidenceType: null,
      evidenceUploadedAt: null,
    },
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
}

export async function deleteCandidate(candidateId: string) {
  await requireAdmin();
  await db.candidate.delete({ where: { id: candidateId } });
  redirect("/admin/candidates");
}

export async function changeCandidateLevel(candidateId: string, levelId: string) {
  await requireAdmin();
  await db.candidate.update({ where: { id: candidateId }, data: { levelId } });
  revalidatePath(`/admin/candidates/${candidateId}`);
}
