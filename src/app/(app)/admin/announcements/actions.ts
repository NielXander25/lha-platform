"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(formData: FormData) {
  const session = await auth();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.announcement.create({
    data: { title, body, pinned: formData.get("pinned") === "on", authorId: session?.user.id },
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}
