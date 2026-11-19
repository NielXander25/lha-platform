import "server-only";
import { prisma } from "@/lib/prisma";

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: "Account created",
  PROFILE_INCOMPLETE: "Profile incomplete",
  AWAITING_TIMETABLE: "Awaiting timetable",
  TIMETABLE_PROCESSING: "Timetable processing",
  AWAITING_TIMETABLE_CONFIRMATION: "Awaiting timetable confirmation",
  AWAITING_PAYMENT: "Awaiting payment",
  PAYMENT_PENDING: "Payment pending",
  PAYMENT_VERIFIED: "Payment verified",
  AWAITING_ALLOCATION: "Awaiting tutor allocation",
  ALLOCATED: "Allocated",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  COMPLETED: "Completed",
};

// Statuses decided by payment, allocation or staff, which onboarding edits must not undo.
const LOCKED = new Set(["PAYMENT_VERIFIED", "AWAITING_ALLOCATION", "ALLOCATED", "ACTIVE", "SUSPENDED", "COMPLETED"]);

export const ONBOARDING_STEPS = [
  { key: "profile", label: "Academic profile", href: "/portal/profile" },
  { key: "courses", label: "Courses & package", href: "/portal/courses" },
  { key: "timetable", label: "Upload your university timetable", href: "/portal/timetable" },
  { key: "availability", label: "Availability", href: "/portal/availability" },
  { key: "payment", label: "Payment", href: "/portal/payment" },
] as const;

export async function studentProgress(studentId: string) {
  const s = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      user: { select: { id: true, phone: true } },
      _count: { select: { courses: true, timetableEntries: true, timetableUploads: true } },
    },
  });
  const [availability, pendingPayment, activeSubscription] = await Promise.all([
    prisma.availability.count({ where: { userId: s.userId, kind: "AVAILABLE" } }),
    prisma.payment.count({
      where: { invoice: { studentId, status: { in: ["UNPAID", "PARTIALLY_PAID"] } }, status: { in: ["PENDING", "UNDER_REVIEW"] }, method: "BANK_TRANSFER" },
    }),
    prisma.subscription.count({ where: { studentId, status: "ACTIVE", endsAt: { gt: new Date() } } }),
  ]);
  const done = {
    profile: Boolean(s.departmentId && s.level && s.semester && s.user.phone),
    courses: Boolean(s._count.courses > 0 && s.packageId),
    // A timetable counts only once a file is uploaded and the student has confirmed the entries.
    timetable: s.timetableConfirmed && s._count.timetableUploads > 0,
    availability: availability > 0,
    // Paid (or given free access by staff): an active subscription counts as payment done.
    payment: LOCKED.has(s.status) || activeSubscription > 0,
  };
  return { student: s, done, pendingPayment: pendingPayment > 0 };
}

/** Recompute an onboarding status from what the student has filled in. */
export async function refreshStudentStatus(studentId: string) {
  const { student, done, pendingPayment } = await studentProgress(studentId);
  if (LOCKED.has(student.status)) return student.status;
  // Free access granted before the student finished onboarding: queue them once everything is in.
  if (done.payment && done.profile && done.courses && done.timetable && done.availability) {
    await prisma.studentProfile.update({ where: { id: studentId }, data: { status: "AWAITING_ALLOCATION" } });
    return "AWAITING_ALLOCATION";
  }
  const processing = await prisma.timetableUpload.count({ where: { studentId, status: "PROCESSING" } });
  const status = !done.profile || !done.courses
    ? "PROFILE_INCOMPLETE"
    : processing > 0
      ? "TIMETABLE_PROCESSING"
    : !done.timetable
      ? student._count.timetableEntries > 0 && student._count.timetableUploads > 0
        ? "AWAITING_TIMETABLE_CONFIRMATION"
        : "AWAITING_TIMETABLE"
      : !done.availability
        ? "PROFILE_INCOMPLETE"
        : pendingPayment
          ? "PAYMENT_PENDING"
          : "AWAITING_PAYMENT";
  if (status !== student.status) await prisma.studentProfile.update({ where: { id: studentId }, data: { status } });
  return status;
}

/** Next free student ID, e.g. LHA-26-0007. */
export async function nextStudentCode() {
  const yy = new Date().getFullYear().toString().slice(2);
  const prefix = `LHA-${yy}-`;
  const last = await prisma.studentProfile.findFirst({
    where: { studentCode: { startsWith: prefix } },
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });
  const n = last ? Number(last.studentCode.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}
