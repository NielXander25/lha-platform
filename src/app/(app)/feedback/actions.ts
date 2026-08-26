"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function submitSessionFeedback(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.sessionFeedback.create({
    data: {
      userId: session.user.id,
      usefulnessScore: Number(formData.get("usefulnessScore")) || null,
      clarityScore: Number(formData.get("clarityScore")) || null,
      mostValuable: String(formData.get("mostValuable") ?? ""),
      couldImprove: String(formData.get("couldImprove") ?? ""),
      otherNotes: String(formData.get("otherNotes") ?? ""),
    },
  });
  redirect("/feedback?sent=1");
}
