"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { assertRole, hashPassword, ROLES } from "@/lib/auth";
import { settlePayment } from "@/lib/billing";
import { LEVELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// Every action re-checks the role: Server Actions can be called directly, not just from our pages.
const requireAdmin = () => assertRole(["ADMIN"]);
const requireFinance = () => assertRole(["ADMIN", "FINANCE"]);

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
  revalidatePath("/admin/assignments");
  revalidatePath("/tutorials");
  if (course) revalidatePath(`/tutorials/${course.slug}`);
}

export async function createAssignment(formData: FormData) {
  await requireAdmin();
  const parsed = AssignmentSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/assignments", parsed.error.issues[0]?.message ?? "Invalid assignment.");
  const { courseId, tutorId, locationId, schedule } = parsed.data;

  const existing = await prisma.assignment.findUnique({
    where: { courseId_tutorId_locationId: { courseId, tutorId, locationId } },
  });
  if (existing) fail("/admin/assignments", "That tutor is already assigned to this tutorial at that location.");

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
  level: z.enum(LEVELS),
  summary: z.string().trim().min(5),
  description: z.string().trim().min(5),
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

  await prisma.course.create({
    data: { ...parsed.data, slug, departments: { connect: departmentIds(formData) } },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/tutorials");
}

function departmentIds(formData: FormData) {
  return formData
    .getAll("departmentIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((id) => ({ id }));
}

// Change which level and departments a course belongs to.
export async function updateCourseAudience(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const level = z.enum(LEVELS).safeParse(formData.get("level"));
  if (!level.success) fail("/admin/courses", "Choose a level from 100 to 500.");
  const course = await prisma.course.update({
    where: { id },
    data: { level: level.data, departments: { set: departmentIds(formData) } },
  });
  revalidatePath("/admin", "layout");
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

/* ---------- Pricing tiers ---------- */

const PackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2),
  ratio: z.string().trim().min(2),
  description: z.string().trim().min(2),
  monthlyPrice: z.coerce.number().int().nonnegative(),
  quarterlyPrice: z.coerce.number().int().nonnegative(),
  capacity: z.coerce.number().int().min(1).max(100),
  sessionsPerWeek: z.coerce.number().int().min(1).max(14),
  sessionMinutes: z.coerce.number().int().min(15).max(480),
});

export async function updatePackage(formData: FormData) {
  const user = await requireAdmin();
  const parsed = PackageSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/pricing", "Fill in every field; prices and numbers must be whole numbers.");
  const { id, ...data } = parsed.data;
  const before = await prisma.package.findUniqueOrThrow({ where: { id } });
  await prisma.package.update({ where: { id }, data });
  await audit({ actorId: user.id, action: "package.updated", entity: "Package", entityId: id, details: { before: { monthlyPrice: before.monthlyPrice, quarterlyPrice: before.quarterlyPrice, capacity: before.capacity }, after: data } });
  revalidatePath("/", "layout");
}

/* ---------- Departments ---------- */

export async function createDepartment(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) fail("/admin/departments", "Please enter a department name.");
  if (await prisma.department.findUnique({ where: { name } })) {
    fail("/admin/departments", "That department already exists.");
  }
  await prisma.department.create({ data: { name } });
  revalidatePath("/admin", "layout");
  revalidatePath("/tutorials", "layout");
}

export async function toggleDepartment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const department = await prisma.department.findUniqueOrThrow({ where: { id } });
  await prisma.department.update({ where: { id }, data: { active: !department.active } });
  revalidatePath("/admin", "layout");
  revalidatePath("/tutorials", "layout");
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
    // Staff-added tutors are vetted by the person adding them.
    data: { ...parsed.data, phone: parsed.data.phone || null, bio: parsed.data.bio || null, status: "APPROVED", approvedAt: new Date() },
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

/* ---------- Tutor applications ---------- */

export async function reviewTutor(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  if (!["APPROVED", "REJECTED", "SUSPENDED"].includes(decision)) fail("/admin/tutors", "Unknown decision.");
  await prisma.tutor.update({
    where: { id },
    data: { status: decision, reviewNote: note, approvedAt: decision === "APPROVED" ? new Date() : null, active: decision === "APPROVED" },
  });
  // Approving a tutor also approves every course they chose; staff can still remove any one.
  if (decision === "APPROVED") await prisma.tutorCourse.updateMany({ where: { tutorId: id }, data: { approved: true } });
  await audit({ actorId: user.id, action: `tutor.${decision.toLowerCase()}`, entity: "Tutor", entityId: id, details: { note } });
  if (decision === "APPROVED") (await import("@/lib/matching/respond")).scheduleMatching();
  const { tutorDecisionEmail } = await import("@/lib/tutor-emails");
  const emailed = await tutorDecisionEmail(id, decision, note);
  revalidatePath("/admin", "layout");
  redirect(`/admin/tutors/${id}?ok=${encodeURIComponent(`Tutor ${decision.toLowerCase()}.${emailed ? " We've emailed them." : ""}`)}`);
}


export async function setCourseCompetency(formData: FormData) {
  const user = await requireAdmin();
  const tutorId = String(formData.get("tutorId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const approved = formData.get("approved") === "true";
  await prisma.tutorCourse.update({ where: { tutorId_courseId: { tutorId, courseId } }, data: { approved } });
  await audit({ actorId: user.id, action: approved ? "tutor.course_approved" : "tutor.course_unapproved", entity: "Tutor", entityId: tutorId, details: { courseId } });
  if (approved) (await import("@/lib/matching/respond")).scheduleMatching();
  revalidatePath(`/admin/tutors/${tutorId}`);
}

/* ---------- Students ---------- */

export async function setStudentSuspended(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const suspend = formData.get("suspend") === "true";
  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id } });
  // Lifting a suspension returns an active subscriber to the allocation queue; others go back through onboarding.
  const hasActive = await prisma.subscription.count({ where: { studentId: id, status: "ACTIVE", endsAt: { gt: new Date() } } });
  const status = suspend ? "SUSPENDED" : hasActive ? "AWAITING_ALLOCATION" : "PROFILE_INCOMPLETE";
  await prisma.studentProfile.update({ where: { id }, data: { status } });
  if (!suspend && !hasActive) {
    const { refreshStudentStatus } = await import("@/lib/students");
    await refreshStudentStatus(id);
  }
  await audit({ actorId: user.id, action: suspend ? "student.suspended" : "student.unsuspended", entity: "StudentProfile", entityId: id, details: { from: student.status } });
  revalidatePath(`/admin/students/${id}`);
}

/* ---------- Finance: bank transfer reconciliation ---------- */

const ReconcileSchema = z.object({
  paymentId: z.string().min(1),
  amountReceived: z.coerce.number().int().positive("Enter the amount that actually arrived in the bank."),
  bankReference: z.string().trim().min(4, "Enter the bank statement reference for this credit."),
});

export async function verifyTransfer(formData: FormData) {
  const user = await requireFinance();
  const parsed = ReconcileSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/payments", parsed.error.issues[0].message);
  const { paymentId, amountReceived, bankReference } = parsed.data;

  // The same bank credit can't be used to verify two payments.
  const reused = await prisma.payment.findFirst({ where: { bankReference, id: { not: paymentId } } });
  if (reused) fail("/admin/payments", `Bank reference ${bankReference} was already used for payment ${reused.reference}.`);

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.method !== "BANK_TRANSFER") fail("/admin/payments", "Only bank transfers are verified here.");

  const { changed, activated } = await settlePayment({ paymentId, outcome: "SUCCESS", amountReceived, bankReference, actorId: user.id });
  if (!changed) fail("/admin/payments", "That payment was already processed.");
  if (activated) (await import("@/lib/matching/respond")).scheduleMatching();
  revalidatePath("/admin", "layout");
  redirect("/admin/payments?ok=" + encodeURIComponent(`Transfer ${payment.reference} verified.`));
}

export async function rejectTransfer(formData: FormData) {
  const user = await requireFinance();
  const paymentId = String(formData.get("paymentId") ?? "");
  const { changed } = await settlePayment({ paymentId, outcome: "FAILED", actorId: user.id });
  if (!changed) fail("/admin/payments", "That payment was already processed.");
  revalidatePath("/admin", "layout");
  redirect("/admin/payments?ok=" + encodeURIComponent("Transfer marked as not received."));
}

/* ---------- Staff accounts ---------- */

const StaffSchema = z.object({
  name: z.string().trim().min(3),
  email: z.email().trim().toLowerCase(),
  role: z.enum(["ADMIN", "FINANCE", "SUPPORT"]),
  password: z.string().min(10, "Use a temporary password of at least 10 characters."),
});

export async function createStaff(formData: FormData) {
  const user = await requireAdmin();
  const parsed = StaffSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/staff", parsed.error.issues[0].message);
  if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) fail("/admin/staff", "A user with that email already exists.");
  const created = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
  });
  await audit({ actorId: user.id, action: "staff.created", entity: "User", entityId: created.id, details: { role: created.role } });
  redirect("/admin/staff?ok=" + encodeURIComponent(`${created.name} can now log in as ${created.role.toLowerCase()}.`));
}

export async function setUserActive(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (id === user.id) fail("/admin/staff", "You can't deactivate your own account.");
  const target = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (!ROLES.includes(target.role as (typeof ROLES)[number])) fail("/admin/staff", "Unknown user.");
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { active } }),
    ...(active ? [] : [prisma.session.deleteMany({ where: { userId: id } })]),
  ]);
  await audit({ actorId: user.id, action: active ? "user.activated" : "user.deactivated", entity: "User", entityId: id });
  revalidatePath("/admin/staff");
}

/* ---------- Matching ---------- */

export async function runMatchingNow() {
  const user = await requireAdmin();
  const { runMatching } = await import("@/lib/matching/run");
  const s = await runMatching(user.id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/matching?ok=${encodeURIComponent(`Matching finished: ${s.matched} matched, ${s.waiting} waiting, ${s.conflicts} with conflicts.`)}`);
}

const WeightsSchema = z.object({
  competence: z.coerce.number().int().min(0).max(100),
  schedule: z.coerce.number().int().min(0).max(100),
  experience: z.coerce.number().int().min(0).max(100),
  requirements: z.coerce.number().int().min(0).max(100),
  workload: z.coerce.number().int().min(0).max(100),
});

export async function saveMatchingWeights(formData: FormData) {
  const user = await requireAdmin();
  const parsed = WeightsSchema.safeParse(form(formData));
  if (!parsed.success) fail("/admin/matching", "Weights must be whole numbers from 0 to 100.");
  const total = Object.values(parsed.data).reduce((a, b) => a + b, 0);
  if (total !== 100) fail("/admin/matching", `Weights must add up to 100 (they add up to ${total}).`);
  const { saveWeights } = await import("@/lib/matching/run");
  await saveWeights(parsed.data);
  await audit({ actorId: user.id, action: "matching.weights_updated", entity: "Setting", entityId: "matching.weights", details: parsed.data });
  redirect("/admin/matching?ok=" + encodeURIComponent("Weights saved. They apply to the next matching run."));
}

export async function manualAssign(formData: FormData) {
  const user = await requireAdmin();
  const allocationId = String(formData.get("allocationId") ?? "");
  const tutorId = String(formData.get("tutorId") ?? "");
  const alloc = await prisma.allocation.findUniqueOrThrow({ where: { id: allocationId }, include: { course: true } });
  const tutor = await prisma.tutor.findFirst({ where: { id: tutorId, status: "APPROVED", active: true } });
  if (!tutor) redirect(`/admin/matching/${allocationId}?error=${encodeURIComponent("Choose an approved tutor.")}`);
  // Choosing a tutor for a course they aren't approved for yet approves them for it, in one step.
  const link = await prisma.tutorCourse.findUnique({ where: { tutorId_courseId: { tutorId, courseId: alloc.courseId } } });
  if (!link?.approved) {
    await prisma.tutorCourse.upsert({
      where: { tutorId_courseId: { tutorId, courseId: alloc.courseId } },
      update: { approved: true },
      create: { tutorId, courseId: alloc.courseId, approved: true },
    });
  }
  const { assignManually } = await import("@/lib/matching/run");
  const result = await assignManually(allocationId, tutorId, user.id);
  if (!link?.approved) {
    if (result.ok) {
      await audit({ actorId: user.id, action: "tutor.course_approved", entity: "Tutor", entityId: tutorId, details: { courseId: alloc.courseId, via: "manual assignment" } });
    } else {
      // The assignment didn't go through, so leave the tutor's courses as they were.
      const key = { tutorId_courseId: { tutorId, courseId: alloc.courseId } };
      if (link) await prisma.tutorCourse.update({ where: key, data: { approved: false } });
      else await prisma.tutorCourse.delete({ where: key });
    }
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/matching/${allocationId}?${result.ok ? "ok" : "error"}=${encodeURIComponent(result.message)}`);
}

export async function adminCancelClass(formData: FormData) {
  const user = await requireAdmin();
  const classId = String(formData.get("classId") ?? "");
  const back = String(formData.get("back") ?? "/admin/matching");
  const { cancelClass } = await import("@/lib/matching/respond");
  await cancelClass(classId, user.id);
  revalidatePath("/admin", "layout");
  redirect(`${back.startsWith("/admin") ? back : "/admin/matching"}?ok=${encodeURIComponent("Class cancelled. Its students are back in the queue.")}`);
}

/* ---------- Free access (testing, scholarships) ---------- */

export async function grantFreeAccess(formData: FormData) {
  const user = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const months = Math.min(12, Math.max(1, Number(formData.get("months") ?? 1) || 1));
  const back = `/admin/students/${studentId}`;
  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId } });
  if (!student.packageId) fail(back, "The student needs to choose a package first (step 2 of registration).");
  const now = new Date();
  if (await prisma.subscription.count({ where: { studentId, status: "ACTIVE", endsAt: { gt: now } } })) {
    fail(back, "This student already has an active subscription.");
  }
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + months);

  await prisma.$transaction(async (tx) => {
    // Unpaid invoices are no longer needed; anything with money on it is left for finance.
    const open = await tx.invoice.findMany({ where: { studentId, status: "UNPAID", amountPaid: 0 } });
    for (const inv of open) {
      await tx.invoice.update({ where: { id: inv.id }, data: { status: "VOID" } });
      await tx.subscription.update({ where: { id: inv.subscriptionId }, data: { status: "CANCELLED" } });
    }
    // Recorded as a free subscription with no payment, so revenue figures stay accurate.
    const sub = await tx.subscription.create({
      data: { studentId, packageId: student.packageId!, cycle: "COMPLIMENTARY", months, amount: 0, status: "ACTIVE", startsAt: now, endsAt },
    });
    await audit({ actorId: user.id, action: "subscription.complimentary", entity: "Subscription", entityId: sub.id, details: { studentId, months } }, tx);
  });
  const { refreshStudentStatus } = await import("@/lib/students");
  await refreshStudentStatus(studentId);
  (await import("@/lib/matching/respond")).scheduleMatching();
  revalidatePath("/admin", "layout");
  redirect(`${back}?ok=${encodeURIComponent(`Free access granted for ${months} month${months === 1 ? "" : "s"}.`)}`);
}
