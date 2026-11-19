import { cn } from "@/lib/utils";

const STAGES = [
  { n: 1, label: "Profile", statuses: ["ACCOUNT_CREATED", "PROFILE_INCOMPLETE"], tone: "bg-slate-200 text-slate-700" },
  { n: 2, label: "Timetable", statuses: ["AWAITING_TIMETABLE", "TIMETABLE_PROCESSING", "AWAITING_TIMETABLE_CONFIRMATION"], tone: "bg-amber-100 text-amber-800" },
  { n: 3, label: "Payment", statuses: ["AWAITING_PAYMENT", "PAYMENT_PENDING", "PAYMENT_VERIFIED"], tone: "bg-orange-100 text-orange-800" },
  { n: 4, label: "Matching", statuses: ["AWAITING_ALLOCATION"], tone: "bg-accent-300/40 text-accent-600" },
  { n: 5, label: "Matched", statuses: ["ALLOCATED", "ACTIVE", "COMPLETED"], tone: "bg-emerald-100 text-emerald-800" },
];

/** A numbered badge showing which of the five stages a student has reached. */
export function StageMark({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  if (status === "SUSPENDED") {
    return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Suspended</span>;
  }
  const stage = STAGES.find((s) => s.statuses.includes(status)) ?? STAGES[0];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold", stage.tone)} title={`Stage ${stage.n} of 5`}>
      <span className={cn("grid place-items-center rounded-full bg-white/80 font-bold", size === "sm" ? "size-4 text-[10px]" : "size-5")}>{stage.n}</span>
      {stage.label}
      <span className="flex gap-0.5 pl-0.5" aria-hidden>
        {STAGES.map((s) => (
          <span key={s.n} className={cn("size-1.5 rounded-full", s.n <= stage.n ? "bg-current" : "bg-current opacity-25")} />
        ))}
      </span>
    </span>
  );
}

const PACKAGE_TONE: Record<string, string> = {
  GENERAL: "bg-brand-100 text-brand-800",
  SEMI_PRIVATE: "bg-accent-300/40 text-accent-600",
  PRIVATE: "bg-brand-900 text-white",
};

export function PackageMark({ code, name }: { code?: string | null; name?: string | null }) {
  if (!code || !name) return <span className="text-xs text-slate-400">No package</span>;
  return <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", PACKAGE_TONE[code] ?? "bg-slate-100 text-slate-700")}>{name}</span>;
}
