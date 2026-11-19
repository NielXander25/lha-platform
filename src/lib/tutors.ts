export const TUTOR_STATUS = {
  PENDING: { label: "Awaiting review", tone: "warn" },
  APPROVED: { label: "Approved", tone: "good" },
  REJECTED: { label: "Rejected", tone: "bad" },
  SUSPENDED: { label: "Suspended", tone: "bad" },
} as const;
