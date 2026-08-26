"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProgrammeStatus } from "@prisma/client";

export async function updateProgrammeStatus(userId: string, status: ProgrammeStatus) {
  await prisma.user.update({ where: { id: userId }, data: { programmeStatus: status } });
  revalidatePath(`/admin/participants/${userId}`);
  revalidatePath("/admin/participants");
}

export async function assignPod(userId: string, podId: string) {
  await prisma.user.update({ where: { id: userId }, data: { podId: podId || null } });
  revalidatePath(`/admin/participants/${userId}`);
  revalidatePath("/admin/pods");
}

export async function togglePodRep(userId: string, isRep: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { isPodRepresentative: isRep } });
  revalidatePath(`/admin/participants/${userId}`);
}
