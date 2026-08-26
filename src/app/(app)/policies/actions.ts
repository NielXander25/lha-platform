"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function acknowledgePolicy(policyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.policyAcknowledgement.upsert({
    where: { userId_policyId: { userId: session.user.id, policyId } },
    update: { acceptedAt: new Date() },
    create: { userId: session.user.id, policyId },
  });

  revalidatePath("/policies");
}
