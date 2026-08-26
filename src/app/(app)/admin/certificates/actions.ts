"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CompletionCertStatus, PaidCertStatus } from "@prisma/client";

export async function updateCompletionStatus(userId: string, status: CompletionCertStatus) {
  await prisma.certificate.upsert({
    where: { userId },
    update: { completionStatus: status, completionIssuedAt: status === "ISSUED" ? new Date() : undefined },
    create: { userId, completionStatus: status, completionIssuedAt: status === "ISSUED" ? new Date() : undefined },
  });
  revalidatePath("/admin/certificates");
}

export async function updatePaidStatus(userId: string, status: PaidCertStatus) {
  await prisma.certificate.upsert({
    where: { userId },
    update: { paidStatus: status, paidIssuedAt: status === "ISSUED" ? new Date() : undefined },
    create: { userId, paidStatus: status, paidIssuedAt: status === "ISSUED" ? new Date() : undefined },
  });
  revalidatePath("/admin/certificates");
}
