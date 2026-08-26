"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Payment integration is a Phase 3 item (see roadmap) — this records the
// request so an admin/payment-webhook can move it through the pipeline.
export async function requestPaidCertificate(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const wantsHardCopy = formData.get("wantsHardCopy") === "on";
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "");

  await prisma.certificate.upsert({
    where: { userId: session.user.id },
    update: {
      paidStatus: "REQUESTED",
      paidAmountKobo: 1500000,
      wantsHardCopy,
      deliveryAddress: wantsHardCopy ? deliveryAddress : null,
    },
    create: {
      userId: session.user.id,
      paidStatus: "REQUESTED",
      paidAmountKobo: 1500000,
      wantsHardCopy,
      deliveryAddress: wantsHardCopy ? deliveryAddress : null,
    },
  });

  revalidatePath("/certificate");
}
