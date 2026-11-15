export const SITE = {
  name: "Learning Hub Africa",
  tagline: "Expert tutors. Real progress.",
  email: "hello@learninghubafrica.com",
  phone: "+234 800 000 0000",
};

export const ENROLLMENT_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: "Awaiting tutor",
  ASSIGNED: "Tutor assigned",
  ACTIVE: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-sky-100 text-sky-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};
