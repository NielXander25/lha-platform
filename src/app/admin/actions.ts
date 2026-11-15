"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function form(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
}

/* ---------- Assignments: tutor + location for a course ---------- */

const AssignmentSchema = z.object({
  courseId: z.string().min(1),
  tutorId: z.string().min(1, "Choose a tutor."),
  locationId: z.string().min(1, "Choose a location."),
  schedule: z.string().trim().max(120).optional(),
});

async function revalidateCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true } });
  revalidatePath("/admin");
  revalidatePath("/tutorials");
  if (course) revalidatePath(`/tutorials/${course.slug}`);
}

export async function createAssignment(formData: FormData) {
  await requireAdmin();
  const parsed = AssignmentSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin", parsed.error.issues[0]?.message ?? "Invalid assignment.");
  const { courseId, tutorId, locationId, schedule } = parsed.data;

  const existing = await prisma.assignment.findUnique({
    where: { courseId_tutorId_locationId: { courseId, tutorId, locationId } },
  });
  if (existing) fail("/admin", "That tutor is already assigned to this tutorial at that location.");

  await prisma.assignment.create({
    data: { courseId, tutorId, locationId, schedule: schedule || null },
  });
  await revalidateCourse(courseId);
}

export async function updateAssignmentSchedule(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const schedule = String(formData.get("schedule") ?? "").trim().slice(0, 120);
  const a = await prisma.assignment.update({ where: { id }, data: { schedule: schedule || null } });
  await revalidateCourse(a.courseId);
}

export async function deleteAssignment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const a = await prisma.assignment.delete({ where: { id } });
  await revalidateCourse(a.courseId);
}

/* ---------- Courses ---------- */

const CourseSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => v || null),
  title: z.string().trim().min(2),
  category: z.string().trim().min(2),
  level: z.string().trim().min(2),
  summary: z.string().trim().min(5),
  description: z.string().trim().min(5),
  price: z.coerce.number().int().nonnegative(),
  billingUnit: z.string().trim().min(2).default("semester"),
  sessionsPerWeek: z.coerce.number().int().min(1).max(14),
  sessionLengthMins: z.coerce.number().int().min(15).max(480),
});

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const parsed = CourseSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/courses", "Please fill in every course field correctly.");

  const base = slugify(parsed.data.code ?? parsed.data.title) || "course";
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
  revalidatePath("/admin", "layout");
  revalidatePath("/tutorials", "layout");
}

/* ---------- Locations ---------- */

const LocationSchema = z.object({
  name: z.string().trim().min(2),
  kind: z.string().trim().min(2),
});

export async function createLocation(formData: FormData) {
  await requireAdmin();
  const parsed = LocationSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/locations", "Please enter a venue name and type.");
  if (await prisma.location.findUnique({ where: { name: parsed.data.name } })) {
    fail("/admin/locations", "A venue with that name already exists.");
  }
  await prisma.location.create({ data: parsed.data });
  revalidatePath("/admin/locations");
}

export async function toggleLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const location = await prisma.location.findUniqueOrThrow({ where: { id } });
  await prisma.location.update({ where: { id }, data: { active: !location.active } });
  revalidatePath("/admin", "layout");
  revalidatePath("/tutorials", "layout");
}
