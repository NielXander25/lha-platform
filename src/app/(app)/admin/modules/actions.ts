"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createModule(formData: FormData) {
  const number = Number(formData.get("number"));
  const title = String(formData.get("title") ?? "").trim();
  if (!number || !title) return;
  const mod = await prisma.module.create({ data: { number, title } });
  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${mod.id}`);
}

export async function updateModule(moduleId: string, formData: FormData) {
  await prisma.module.update({
    where: { id: moduleId },
    data: {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      learningObjectives: String(formData.get("learningObjectives") ?? ""),
      meetingLink: String(formData.get("meetingLink") ?? ""),
      recordingUrl: String(formData.get("recordingUrl") ?? ""),
      reflectionPrompt: String(formData.get("reflectionPrompt") ?? ""),
      availability: (String(formData.get("availability") ?? "AUTOMATED")) as never,
      manuallyUnlocked: formData.get("manuallyUnlocked") === "on",
      availableFrom: formData.get("availableFrom") ? new Date(String(formData.get("availableFrom"))) : null,
    },
  });
  revalidatePath(`/admin/modules/${moduleId}`);
  revalidatePath("/modules");
}

export async function addResource(moduleId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = String(formData.get("type") ?? "link");
  if (!title || !url) return;
  await prisma.resource.create({ data: { moduleId, title, url, type } });
  revalidatePath(`/admin/modules/${moduleId}`);
  revalidatePath("/resources");
}

export async function setCalendarEvent(moduleId: string, formData: FormData) {
  const title = String(formData.get("eventTitle") ?? "");
  const date = String(formData.get("eventDate") ?? "");
  if (!title || !date) return;

  await prisma.calendarEvent.upsert({
    where: { moduleId },
    update: {
      title,
      date: new Date(date),
      time: String(formData.get("eventTime") ?? ""),
      facilitator: String(formData.get("facilitator") ?? ""),
      meetingLink: String(formData.get("meetingLink2") ?? ""),
      preparation: String(formData.get("preparation") ?? ""),
    },
    create: {
      moduleId,
      title,
      date: new Date(date),
      time: String(formData.get("eventTime") ?? ""),
      facilitator: String(formData.get("facilitator") ?? ""),
      meetingLink: String(formData.get("meetingLink2") ?? ""),
      preparation: String(formData.get("preparation") ?? ""),
    },
  });
  revalidatePath(`/admin/modules/${moduleId}`);
  revalidatePath("/calendar");
}

export async function createAssessment(moduleId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "Module Assessment");
  await prisma.assessment.create({ data: { moduleId, title } });
  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function addQuestion(assessmentId: string, moduleId: string, formData: FormData) {
  const type = String(formData.get("type")) as
    | "MULTIPLE_CHOICE"
    | "MULTIPLE_ANSWER"
    | "SHORT_ANSWER"
    | "LONG_ANSWER"
    | "SCENARIO";
  const prompt = String(formData.get("prompt") ?? "");
  const optionsRaw = String(formData.get("options") ?? "");
  const correctRaw = String(formData.get("correct") ?? "");

  let options: { id: string; text: string }[] | null = null;
  let correctAnswer: string | string[] | null = null;

  if (type === "MULTIPLE_CHOICE" || type === "MULTIPLE_ANSWER") {
    const lines = optionsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    options = lines.map((text, i) => ({ id: `opt${i + 1}`, text }));
    if (type === "MULTIPLE_CHOICE") {
      const idx = Number(correctRaw) - 1;
      correctAnswer = options[idx]?.id ?? null;
    } else {
      const idxs = correctRaw.split(",").map((s) => Number(s.trim()) - 1);
      correctAnswer = idxs.map((i) => options?.[i]?.id).filter(Boolean) as string[];
    }
  }

  const count = await prisma.question.count({ where: { assessmentId } });

  await prisma.question.create({
    data: { assessmentId, type, prompt, options: options ?? undefined, correctAnswer: correctAnswer ?? undefined, order: count },
  });
  revalidatePath(`/admin/modules/${moduleId}`);
}
