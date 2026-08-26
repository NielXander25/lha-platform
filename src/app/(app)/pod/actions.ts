"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitNugget(podId: string, week: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await prisma.sessionNugget.create({
    data: { podId, week, content, submittedById: session.user.id },
  });
  revalidatePath("/pod");
}

export async function submitPodFeedback(podId: string, week: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.podFeedback.create({
    data: {
      podId,
      week,
      engagementLevel: String(formData.get("engagementLevel")) as never,
      strongestPart: String(formData.get("strongestPart") ?? ""),
      standoutMoment: String(formData.get("standoutMoment") ?? ""),
      strugglingNote: String(formData.get("strugglingNote") ?? ""),
      otherNotes: String(formData.get("otherNotes") ?? ""),
      submittedById: session.user.id,
    },
  });
  revalidatePath("/pod");
}
