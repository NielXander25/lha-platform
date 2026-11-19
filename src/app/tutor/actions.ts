"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { currentTutor } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { slotsToRanges, SLOT_MINUTES } from "@/lib/schedule";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

function back(path: string, msg: { ok?: string; error?: string }): never {
  redirect(`${path}?${new URLSearchParams(msg as Record<string, string>)}`);
}

const ProfileSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  departmentId: z.string().optional(),
  qualifications: z.string().trim().min(5, "Describe your qualifications.").max(1000),
  experienceYears: z.coerce.number().int().min(0).max(60),
  bio: z.string().trim().max(1000).optional(),
  teachingMode: z.enum(["IN_PERSON", "ONLINE", "BOTH"]),
  preferredLocationId: z.string().optional(),
  maxWeeklyHours: z.coerce.number().int().min(1, "Set at least 1 hour a week.").max(60),
  maxClassCapacity: z.coerce.number().int().min(1).max(50),
});

export async function saveTutorProfile(fd: FormData) {
  const { user, tutor } = await currentTutor();
  const parsed = ProfileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/tutor/profile", { error: parsed.error.issues[0].message });
  const { phone, ...data } = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { phone } }),
    prisma.tutor.update({
      where: { id: tutor.id },
      data: { ...data, phone, departmentId: data.departmentId || null, preferredLocationId: data.preferredLocationId || null, bio: data.bio || null },
    }),
  ]);
  redirect("/tutor/courses");
}

const SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
};

export async function uploadCredential(fd: FormData) {
  const { user, tutor } = await currentTutor();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back("/tutor/profile", { error: "Choose a file to upload." });
  const f = file as File;
  if (f.size > MAX_UPLOAD_BYTES) back("/tutor/profile", { error: "That file is larger than 4 MB." });
  const bytes = Buffer.from(await f.arrayBuffer());
  const type = Object.entries(SIGNATURES).find(([, sig]) => sig.every((b, i) => bytes[i] === b))?.[0];
  if (!type) back("/tutor/profile", { error: "Upload a PDF, JPG or PNG file." });
  const cred = await prisma.tutorCredential.create({
    data: { tutorId: tutor.id, fileName: f.name.slice(0, 200), mimeType: type!, size: f.size, data: bytes },
  });
  await audit({ actorId: user.id, action: "tutor.credential_uploaded", entity: "TutorCredential", entityId: cred.id });
  back("/tutor/profile", { ok: "Credential uploaded." });
}

export async function deleteCredential(fd: FormData) {
  const { tutor } = await currentTutor();
  await prisma.tutorCredential.deleteMany({ where: { id: String(fd.get("id")), tutorId: tutor.id } });
  back("/tutor/profile", { ok: "Credential removed." });
}

export async function saveTutorCourses(fd: FormData) {
  const { tutor } = await currentTutor();
  const ids = fd.getAll("courseIds").filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) back("/tutor/courses", { error: "Choose at least one course you can teach." });
  const valid = await prisma.course.findMany({ where: { id: { in: ids }, active: true }, select: { id: true, code: true, title: true } });
  const existing = await prisma.tutorCourse.findMany({ where: { tutorId: tutor.id } });
  const keep = new Set(valid.map((c) => c.id));

  await prisma.$transaction([
    // Removing a course drops its approval; adding one starts unapproved. Kept courses keep their approval.
    prisma.tutorCourse.deleteMany({ where: { tutorId: tutor.id, courseId: { notIn: [...keep] } } }),
    prisma.tutorCourse.createMany({
      data: valid.filter((c) => !existing.some((e) => e.courseId === c.id)).map((c) => ({ tutorId: tutor.id, courseId: c.id })),
    }),
    prisma.tutor.update({ where: { id: tutor.id }, data: { subjects: valid.map((c) => c.code ?? c.title).join(", ") } }),
  ]);
  redirect("/tutor/availability");
}

const SlotsSchema = z.array(z.object({ day: z.number().int().min(0).max(6), startMin: z.number().int().min(0).max(1440 - SLOT_MINUTES) }));

export async function saveTutorAvailability(fd: FormData) {
  const { user } = await currentTutor();
  const available = SlotsSchema.safeParse(JSON.parse(String(fd.get("available") ?? "[]")));
  const unavailable = SlotsSchema.safeParse(JSON.parse(String(fd.get("unavailable") ?? "[]")));
  if (!available.success || !unavailable.success) back("/tutor/availability", { error: "Something went wrong saving your availability." });
  if (available.data!.length === 0) back("/tutor/availability", { error: "Select at least one time you can teach." });
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { userId: user.id } }),
    prisma.availability.createMany({
      data: [
        ...slotsToRanges(available.data!).map((r) => ({ ...r, kind: "AVAILABLE", userId: user.id })),
        ...slotsToRanges(unavailable.data!).map((r) => ({ ...r, kind: "UNAVAILABLE", userId: user.id })),
      ],
    }),
  ]);
  (await import("@/lib/matching/respond")).scheduleMatching();
  back("/tutor", { ok: "Availability saved." });
}

export async function respondToClass(fd: FormData) {
  const { user, tutor } = await currentTutor();
  const { tutorRespond } = await import("@/lib/matching/respond");
  const result = await tutorRespond(String(fd.get("classId")), tutor.id, fd.get("accept") === "true", user.id);
  back("/tutor", result.ok ? { ok: result.message } : { error: result.message });
}
