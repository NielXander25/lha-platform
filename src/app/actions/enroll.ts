"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const EnrollSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().trim().min(2, "Please enter the student's full name."),
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
  preferredLocationId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type EnrollState = {
  errors?: Partial<Record<"name" | "email" | "phone" | "form", string>>;
  values?: Record<string, string>;
};

export async function enroll(_prev: EnrollState, formData: FormData): Promise<EnrollState> {
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
  const parsed = EnrollSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: EnrollState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<EnrollState["errors"]>;
      errors[key] ??= issue.message;
    }
    return { errors, values: raw };
  }

  const { courseId, name, email, phone, preferredLocationId, notes } = parsed.data;

  const [course, location] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, active: true } }),
    preferredLocationId
      ? prisma.location.findFirst({ where: { id: preferredLocationId, active: true } })
      : null,
  ]);
  if (!course) {
    return { errors: { form: "This tutorial is no longer available." }, values: raw };
  }

  await prisma.enrollment.create({
    data: {
      course: { connect: { id: course.id } },
      // Existing students (same email) keep their stored details.
      student: { connectOrCreate: { where: { email }, create: { name, email, phone } } },
      preferredLocationId: location?.id ?? null,
      notes: notes || null,
    },
  });

  redirect(`/enroll/success?course=${encodeURIComponent(course.slug)}`);
}
