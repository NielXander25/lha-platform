"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { newReference, openInvoiceFor } from "@/lib/billing";
import { currentStudent } from "@/lib/current";
import { LEVELS } from "@/lib/constants";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { parseTime, slotsToRanges, SLOT_MINUTES } from "@/lib/schedule";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { refreshStudentStatus, studentProgress } from "@/lib/students";
import { extractTimetable, timetableAiConfigured } from "@/lib/timetable-ai";
import { learnCoursesFromTimetable } from "@/lib/course-learning";

function back(path: string, msg: { ok?: string; error?: string }): never {
  const qs = new URLSearchParams(msg as Record<string, string>).toString();
  redirect(`${path}?${qs}`);
}

/* ---------- Step 1: academic profile ---------- */

const ProfileSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  institution: z.string().trim().min(3, "Enter your institution."),
  departmentId: z.string().min(1, "Choose your department."),
  level: z.enum(LEVELS, { error: "Choose your level." }),
  semester: z.enum(["FIRST", "SECOND"], { error: "Choose the semester." }),
  matricNumber: z.string().trim().max(40).optional(),
});

export async function saveProfile(fd: FormData) {
  const { user, student } = await currentStudent();
  const parsed = ProfileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/portal/profile", { error: parsed.error.issues[0].message });
  const { phone, matricNumber, ...rest } = parsed.data;
  if (!(await prisma.department.findFirst({ where: { id: rest.departmentId, active: true } }))) {
    back("/portal/profile", { error: "Choose your department." });
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { phone } }),
    prisma.studentProfile.update({ where: { id: student.id }, data: { ...rest, matricNumber: matricNumber || null } }),
  ]);
  await refreshStudentStatus(student.id);
  redirect("/portal/timetable");
}

/* ---------- Step 2: courses, package, billing, teaching mode ---------- */

const CoursesSchema = z.object({
  packageId: z.string().min(1, "Choose a package."),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY"]),
  teachingMode: z.enum(["IN_PERSON", "ONLINE", "BOTH"]),
});

export async function saveCourses(fd: FormData) {
  const { student } = await currentStudent();
  const parsed = CoursesSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/portal/courses", { error: parsed.error.issues[0].message });
  const courseIds = fd.getAll("courseIds").filter((v): v is string => typeof v === "string" && v.length > 0);
  if (courseIds.length === 0) back("/portal/courses", { error: "Choose at least one course you need help with." });

  const [pkg, validCourses] = await Promise.all([
    prisma.package.findFirst({ where: { id: parsed.data.packageId, active: true } }),
    prisma.course.findMany({ where: { id: { in: courseIds }, active: true }, select: { id: true } }),
  ]);
  if (!pkg) back("/portal/courses", { error: "Choose a package." });

  await prisma.$transaction([
    prisma.studentProfile.update({ where: { id: student.id }, data: parsed.data }),
    prisma.studentCourse.deleteMany({ where: { studentId: student.id } }),
    prisma.studentCourse.createMany({ data: validCourses.map((c) => ({ studentId: student.id, courseId: c.id })) }),
  ]);
  await refreshStudentStatus(student.id);
  redirect("/portal/availability");
}

/* ---------- Step 3: university timetable ---------- */

const ALLOWED_TYPES: Record<string, number[][]> = {
  // Check the file's first bytes, not just the name the browser reports.
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
};

export async function uploadTimetable(fd: FormData) {
  const { user, student } = await currentStudent();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) back("/portal/timetable", { error: "Choose a file to upload." });
  const f = file as File;
  if (f.size > MAX_UPLOAD_BYTES) back("/portal/timetable", { error: "That file is larger than 4 MB. Upload a screenshot or photo instead." });
  const bytes = Buffer.from(await f.arrayBuffer());
  const type = Object.entries(ALLOWED_TYPES).find(([, sigs]) => sigs.some((sig) => sig.every((b, i) => bytes[i] === b)))?.[0];
  if (!type) back("/portal/timetable", { error: "Upload a PDF, JPG or PNG file." });

  const ai = timetableAiConfigured();
  const upload = await prisma.timetableUpload.create({
    data: { studentId: student.id, fileName: f.name.slice(0, 200), mimeType: type!, size: f.size, data: bytes, status: ai ? "PROCESSING" : "UPLOADED" },
  });
  await prisma.studentProfile.update({ where: { id: student.id }, data: { timetableConfirmed: false } });
  await audit({ actorId: user.id, action: "timetable.uploaded", entity: "TimetableUpload", entityId: upload.id });
  await refreshStudentStatus(student.id);
  if (ai) {
    // Read the timetable after the response is sent, so the student isn't kept waiting.
    after(() => extractTimetable(upload.id));
    // The page itself shows progress while reading, so no banner that would go stale.
    redirect("/portal/timetable");
  }
  back("/portal/timetable", { ok: "Timetable uploaded. Now add your lectures below so we can avoid clashes." });
}

export async function retryTimetableReading(fd: FormData) {
  const { student } = await currentStudent();
  if (!timetableAiConfigured()) back("/portal/timetable", { error: "Automatic reading isn't available right now. Please add your lectures by hand." });
  const upload = await prisma.timetableUpload.findFirst({ where: { id: String(fd.get("id")), studentId: student.id } });
  if (!upload) back("/portal/timetable", { error: "Upload not found." });
  await prisma.timetableUpload.update({ where: { id: upload!.id }, data: { status: "PROCESSING" } });
  await refreshStudentStatus(student.id);
  after(() => extractTimetable(upload!.id));
  redirect("/portal/timetable");
}

const EntrySchema = z.object({
  courseCode: z.string().trim().min(2, "Enter the course code.").max(20).transform((v) => v.toUpperCase()),
  courseTitle: z.string().trim().max(120).optional(),
  day: z.coerce.number().int().min(0).max(6),
  start: z.string(),
  end: z.string(),
  venue: z.string().trim().max(60).optional(),
  activityType: z.string().trim().max(30).optional(),
});

export async function addTimetableEntry(fd: FormData) {
  const { student } = await currentStudent();
  const parsed = EntrySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/portal/timetable", { error: parsed.error.issues[0].message });
  const { start, end, ...rest } = parsed.data;
  const startMin = parseTime(start);
  const endMin = parseTime(end);
  if (startMin === null || endMin === null || endMin <= startMin) {
    back("/portal/timetable", { error: "The end time must be after the start time." });
  }
  await prisma.timetableEntry.create({
    data: {
      ...rest,
      courseTitle: rest.courseTitle || null,
      venue: rest.venue || null,
      activityType: rest.activityType || null,
      studentId: student.id,
      startMin: startMin!,
      endMin: endMin!,
    },
  });
  // Any change means the student must look over and confirm the timetable again.
  await prisma.studentProfile.update({ where: { id: student.id }, data: { timetableConfirmed: false } });
  await learnCoursesFromTimetable(student.id);
  await refreshStudentStatus(student.id);
  back("/portal/timetable", { ok: "Lecture added." });
}

export async function deleteTimetableEntry(fd: FormData) {
  const { student } = await currentStudent();
  await prisma.timetableEntry.deleteMany({ where: { id: String(fd.get("id")), studentId: student.id } });
  await prisma.studentProfile.update({ where: { id: student.id }, data: { timetableConfirmed: false } });
  await refreshStudentStatus(student.id);
  back("/portal/timetable", { ok: "Lecture removed." });
}

export async function confirmTimetable() {
  const { user, student } = await currentStudent();
  const [count, uploads, processing] = await Promise.all([
    prisma.timetableEntry.count({ where: { studentId: student.id } }),
    prisma.timetableUpload.count({ where: { studentId: student.id } }),
    prisma.timetableUpload.count({ where: { studentId: student.id, status: "PROCESSING" } }),
  ]);
  if (uploads === 0) back("/portal/timetable", { error: "We haven't received your timetable yet. Tap \"Tap to choose your timetable\" above and pick the file; it uploads straight away." });
  if (count === 0) {
    back("/portal/timetable", {
      error: processing > 0 ? "We're still reading your timetable. Wait a moment, or add your lectures by hand below." : "Add at least one lecture before confirming.",
    });
  }
  // Confirming with typed lectures stops any reading still in progress, so it can't overwrite them.
  if (processing > 0) await prisma.timetableUpload.updateMany({ where: { studentId: student.id, status: "PROCESSING" }, data: { status: "UPLOADED" } });
  await prisma.studentProfile.update({ where: { id: student.id }, data: { timetableConfirmed: true } });
  await audit({ actorId: user.id, action: "timetable.confirmed", entity: "StudentProfile", entityId: student.id, details: { entries: count } });
  // Learn any new courses from the timetable, then let the student pick from them.
  await learnCoursesFromTimetable(student.id, user.id);
  await refreshStudentStatus(student.id);
  redirect("/portal/courses");
}

/* ---------- Step 4: availability ---------- */

const SlotsSchema = z.array(z.object({ day: z.number().int().min(0).max(6), startMin: z.number().int().min(0).max(1440 - SLOT_MINUTES) }));

export async function saveAvailability(fd: FormData) {
  const { user, student } = await currentStudent();
  const available = SlotsSchema.safeParse(JSON.parse(String(fd.get("available") ?? "[]")));
  const unavailable = SlotsSchema.safeParse(JSON.parse(String(fd.get("unavailable") ?? "[]")));
  if (!available.success || !unavailable.success) back("/portal/availability", { error: "Something went wrong saving your availability." });
  if (available.data!.length === 0) back("/portal/availability", { error: "Select at least one time you're free for tutorials." });

  const rows = [
    ...slotsToRanges(available.data!).map((r) => ({ ...r, kind: "AVAILABLE", userId: user.id })),
    ...slotsToRanges(unavailable.data!).map((r) => ({ ...r, kind: "UNAVAILABLE", userId: user.id })),
  ];
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { userId: user.id } }),
    prisma.availability.createMany({ data: rows }),
  ]);
  await refreshStudentStatus(student.id);
  (await import("@/lib/matching/respond")).scheduleMatching();
  redirect("/portal/payment");
}

/* ---------- Step 5: payment ---------- */

async function assertReadyToPay(studentId: string) {
  const { done } = await studentProgress(studentId);
  if (!done.profile || !done.courses || !done.timetable || !done.availability) {
    back("/portal/payment", { error: "Finish the earlier steps before paying." });
  }
}

export async function startPaystackPayment() {
  const { user, student } = await currentStudent();
  await assertReadyToPay(student.id);
  if (!paystackConfigured()) back("/portal/payment", { error: "Online payment isn't available yet. Use bank transfer." });

  const invoice = await openInvoiceFor(student.id);
  const due = invoice.amount - invoice.amountPaid;
  const reference = newReference("PSK");
  await prisma.payment.create({
    data: { invoiceId: invoice.id, method: "PAYSTACK", reference, amountExpected: due },
  });
  await refreshStudentStatus(student.id);

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  let url: string;
  try {
    const init = await initializeTransaction({
      email: user.email,
      amountNaira: due,
      reference,
      callbackUrl: `${origin}/portal/payment/callback`,
      metadata: { invoice: invoice.number, studentCode: student.studentCode },
    });
    url = init.authorization_url;
  } catch {
    await prisma.payment.update({ where: { reference }, data: { status: "FAILED" } });
    back("/portal/payment", { error: "We couldn't reach Paystack. Please try again in a moment." });
  }
  redirect(url!);
}

const TransferSchema = z.object({
  payerNote: z
    .string()
    .trim()
    .min(5, "Tell us the name on the account you paid from, the date and the bank reference if you have it.")
    .max(500),
});

export async function submitBankTransfer(fd: FormData) {
  const { user, student } = await currentStudent();
  await assertReadyToPay(student.id);
  const parsed = TransferSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) back("/portal/payment", { error: parsed.error.issues[0].message });

  const invoice = await openInvoiceFor(student.id);
  const due = invoice.amount - invoice.amountPaid;
  const already = await prisma.payment.findFirst({
    where: { invoiceId: invoice.id, method: "BANK_TRANSFER", status: "UNDER_REVIEW" },
  });
  if (already) back("/portal/payment", { error: "We already have a transfer under review for this invoice." });

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      method: "BANK_TRANSFER",
      reference: newReference("TRF"),
      amountExpected: due,
      status: "UNDER_REVIEW",
      payerNote: parsed.data.payerNote,
    },
  });
  await audit({ actorId: user.id, action: "payment.transfer_submitted", entity: "Payment", entityId: payment.id });
  await refreshStudentStatus(student.id);
  back("/portal/payment", { ok: "Thanks. Our finance team will confirm your transfer against our bank records and activate your subscription." });
}

export async function respondToProposal(fd: FormData) {
  const { user, student } = await currentStudent();
  const { studentRespond } = await import("@/lib/matching/respond");
  const result = await studentRespond(String(fd.get("classId")), student.id, fd.get("accept") === "true", user.id);
  back("/portal", result.ok ? { ok: result.message } : { error: result.message });
}
