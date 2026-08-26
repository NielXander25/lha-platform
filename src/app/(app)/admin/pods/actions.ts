"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPod(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.pod.create({ data: { name } });
  revalidatePath("/admin/pods");
}

export async function createPodSession(podId: string, formData: FormData) {
  const week = Number(formData.get("week"));
  const caseStudyUrl = String(formData.get("caseStudyUrl") ?? "");
  const questionsRaw = String(formData.get("discussionQuestions") ?? "");
  const discussionQuestions = questionsRaw.split("\n").map((q) => q.trim()).filter(Boolean);

  await prisma.podSession.upsert({
    where: { podId_week: { podId, week } },
    update: { caseStudyUrl, discussionQuestions },
    create: { podId, week, caseStudyUrl, discussionQuestions },
  });
  revalidatePath("/admin/pods");
}
