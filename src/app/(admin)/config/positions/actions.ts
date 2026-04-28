"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const s = await auth();
  if (!s || s.user.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function updateLevelThresholds(
  levelId: string,
  thresholdOk: number,
  thresholdObs: number,
) {
  await requireAdmin();
  await db.riskLevel.update({
    where: { id: levelId },
    data: {
      thresholdOk: Math.max(0, Math.min(100, Math.round(thresholdOk))),
      thresholdObs: Math.max(0, Math.min(100, Math.round(thresholdObs))),
    },
  });
  revalidatePath("/admin/config/positions");
}

export async function updateLevelDescription(levelId: string, description: string) {
  await requireAdmin();
  await db.riskLevel.update({ where: { id: levelId }, data: { description } });
  revalidatePath("/admin/config/positions");
}

export async function addPosition(levelId: string, name: string) {
  await requireAdmin();
  if (!name.trim()) return;
  await db.position.create({ data: { levelId, name: name.trim() } });
  revalidatePath("/admin/config/positions");
}

export async function removePosition(positionId: string) {
  await requireAdmin();
  await db.position.delete({ where: { id: positionId } });
  revalidatePath("/admin/config/positions");
}

export async function toggleLevelTest(levelId: string, testId: string, present: boolean) {
  await requireAdmin();
  if (present) {
    await db.levelTest.upsert({
      where: { levelId_testId: { levelId, testId } },
      update: {},
      create: { levelId, testId, blocking: false },
    });
  } else {
    await db.levelTest.deleteMany({ where: { levelId, testId } });
  }
  revalidatePath("/admin/config/positions");
}

export async function setLevelTestBlocking(
  levelId: string,
  testId: string,
  blocking: boolean,
) {
  await requireAdmin();
  await db.levelTest.update({
    where: { levelId_testId: { levelId, testId } },
    data: { blocking },
  });
  revalidatePath("/admin/config/positions");
}
