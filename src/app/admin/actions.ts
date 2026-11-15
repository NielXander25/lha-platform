"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { ENROLLMENT_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function form(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
}

/* ---------- Enrollments: assign tutor + location ---------- */

const AssignSchema = z.object({
  enrollmentId: z.string().min(1),
  tutorId: optionalId,
  locationId: optionalId,
  status: z.enum(ENROLLMENT_STATUSES),
});

export async function updateEnrollment(formData: FormData) {
  await requireAdmin();
  const parsed = AssignSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin", "Invalid enrolment update.");
  const { enrollmentId, tutorId, locationId } = parsed.data;
  let { status } = parsed.data;

  // Moving out of "pending" automatically once both a tutor and location are set.
  if (status === "PENDING" && tutorId && locationId) status = "ASSIGNED";

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { tutorId, locationId, status },
  });
  revalidatePath("/admin");
}

/* ---------- Courses ---------- */

const CourseSchema = z.object({
  title: z.string().trim().min(2),
  category: z.string().trim().min(2),
  level: z.string().trim().min(2),
  summary: z.string().trim().min(5),
  description: z.string().trim().min(5),
  price: z.coerce.number().int().nonnegative(),
  billingUnit: z.string().trim().min(2).default("month"),
  sessionsPerWeek: z.coerce.number().int().min(1).max(14),
  sessionLengthMins: z.coerce.number().int().min(15).max(480),
});

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const parsed = CourseSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/courses", "Please fill in every course field correctly.");

  const base = slugify(parsed.data.title) || "course";
  let slug = base;
  for (let i = 2; await prisma.course.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  await prisma.course.create({ data: { ...parsed.data, slug } });
  revalidatePath("/admin/courses");
  revalidatePath("/tutorials");
}

const CoursePriceSchema = z.object({
  id: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
  billingUnit: z.string().trim().min(2),
});

export async function updateCoursePrice(formData: FormData) {
  await requireAdmin();
  const parsed = CoursePriceSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/courses", "Price must be a whole number.");
  const { id, ...data } = parsed.data;
  const course = await prisma.course.update({ where: { id }, data });
  revalidatePath("/admin/courses");
  revalidatePath("/tutorials");
  revalidatePath(`/tutorials/${course.slug}`);
}

export async function toggleCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const course = await prisma.course.findUniqueOrThrow({ where: { id } });
  await prisma.course.update({ where: { id }, data: { active: !course.active } });
  revalidatePath("/admin/courses");
  revalidatePath("/tutorials");
  revalidatePath(`/tutorials/${course.slug}`);
}

/* ---------- Tutors ---------- */

const TutorSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().optional(),
  subjects: z.string().trim().min(2),
  bio: z.string().trim().optional(),
});

export async function createTutor(formData: FormData) {
  await requireAdmin();
  const parsed = TutorSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/tutors", "Please enter a name, valid email and subjects.");
  if (await prisma.tutor.findUnique({ where: { email: parsed.data.email } })) {
    fail("/admin/tutors", "A tutor with that email already exists.");
  }
  await prisma.tutor.create({
    data: { ...parsed.data, phone: parsed.data.phone || null, bio: parsed.data.bio || null },
  });
  revalidatePath("/admin/tutors");
}

export async function toggleTutor(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { id } });
  await prisma.tutor.update({ where: { id }, data: { active: !tutor.active } });
  revalidatePath("/admin/tutors");
}

/* ---------- Locations ---------- */

const LocationSchema = z.object({
  name: z.string().trim().min(2),
  city: z.string().trim().min(2),
  address: z.string().trim().optional(),
  isOnline: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export async function createLocation(formData: FormData) {
  await requireAdmin();
  const parsed = LocationSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/locations", "Please enter a name and city.");
  await prisma.location.create({
    data: { ...parsed.data, address: parsed.data.address || null },
  });
  revalidatePath("/admin/locations");
}

export async function toggleLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const location = await prisma.location.findUniqueOrThrow({ where: { id } });
  await prisma.location.update({ where: { id }, data: { active: !location.active } });
  revalidatePath("/admin/locations");
}
