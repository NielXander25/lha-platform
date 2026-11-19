import { DAYS_SHORT, formatTime } from "@/lib/schedule";

export const CLASS_STATUS = {
  AWAITING_TUTOR: { label: "Waiting for tutor", tone: "warn" },
  AWAITING_STUDENTS: { label: "Waiting for student(s)", tone: "info" },
  CONFIRMED: { label: "Confirmed", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "bad" },
} as const;

export const ALLOCATION_TONE: Record<string, "neutral" | "good" | "warn" | "bad" | "info"> = {
  AWAITING_ALLOCATION: "warn",
  CONFLICT_DETECTED: "bad",
  AWAITING_TUTOR_CONFIRMATION: "info",
  AWAITING_STUDENT_CONFIRMATION: "info",
  CONFIRMED: "good",
};

/** "Mon 5:00 pm–7:00 pm · Wed 4:00 pm–6:00 pm" */
export function describeSessions(sessions: { day: number; startMin: number; endMin: number }[]) {
  return [...sessions]
    .sort((a, b) => a.day - b.day || a.startMin - b.startMin)
    .map((s) => `${DAYS_SHORT[s.day]} ${formatTime(s.startMin)}–${formatTime(s.endMin)}`)
    .join(" · ");
}

export const modeLabel = (mode: string) => (mode === "ONLINE" ? "Online" : "In person");
