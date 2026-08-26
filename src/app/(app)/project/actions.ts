"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const userId = session.user.id;

  const data = {
    title: String(formData.get("title") ?? ""),
    problemStatement: String(formData.get("problemStatement") ?? ""),
    teamMembers: String(formData.get("teamMembers") ?? ""),
    research: String(formData.get("research") ?? ""),
    proposedSolution: String(formData.get("proposedSolution") ?? ""),
    progressNotes: String(formData.get("progressNotes") ?? ""),
    evidenceUrl: String(formData.get("evidenceUrl") ?? ""),
  };

  await prisma.project.upsert({
    where: { ownerId: userId },
    update: data,
    create: { ownerId: userId, ...data },
  });

  revalidatePath("/project");
}
