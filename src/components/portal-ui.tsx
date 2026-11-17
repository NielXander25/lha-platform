import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepHeader({ step, title, description }: { step?: string; title: string; description?: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      {step && <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">{step}</p>}
      <h1 className="mt-1 font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
    </header>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 sm:p-6", className)}>{children}</section>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: React.ReactNode }) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-rose-100 text-rose-700",
    info: "bg-brand-100 text-brand-800",
  };
  return <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{label}</span>;
}

export function Checklist({ items }: { items: { label: string; href: string; done: boolean; note?: string }[] }) {
  const next = items.find((i) => !i.done);
  return (
    <ol className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <li key={item.href}>
          <Link href={item.href} className="group flex items-center gap-3 py-3.5">
            {item.done ? (
              <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
            ) : (
              <Circle className={cn("size-6 shrink-0", item === next ? "text-brand-600" : "text-slate-300")} />
            )}
            <span className="flex-1">
              <span className={cn("block font-medium", item.done ? "text-slate-500" : "text-slate-900")}>
                {i + 1}. {item.label}
              </span>
              {item.note && <span className="block text-sm text-slate-500">{item.note}</span>}
            </span>
            {item === next && (
              <span className="flex items-center gap-1 text-sm font-semibold text-brand-700">
                Continue <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function FlashMessage({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <div className="mb-6"><Notice tone="error">{error}</Notice></div>;
  if (ok) return <div className="mb-6"><Notice tone="success">{ok}</Notice></div>;
  return null;
}

export const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
