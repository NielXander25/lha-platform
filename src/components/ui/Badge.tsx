import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  neutral: "bg-[var(--color-surface-alt)] text-[var(--color-ink)]",
  ok: "bg-green-50 text-[var(--color-ok)] border border-green-200",
  warn: "bg-amber-50 text-[var(--color-warn)] border border-amber-200",
  danger: "bg-red-50 text-[var(--color-danger)] border border-red-200",
  gold: "bg-[var(--color-gold-light)] text-[#7a5a12]",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof styles; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", styles[tone])}>
      {children}
    </span>
  );
}
