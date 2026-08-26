"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPolicy(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!title || !content || !slug) return;

  await prisma.policy.upsert({
    where: { slug },
    update: { content, title },
    create: { slug, title, content },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/policies");
}
