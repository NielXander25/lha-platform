import { cn } from "@/lib/utils";

export const inputClass =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-3xl font-semibold text-brand-950">{title}</h1>
      {description && <p className="mt-1 text-stone-500">{description}</p>}
    </header>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </p>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-stone-200 bg-white", className)}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <button
      type="submit"
      className={cn(
        "rounded-lg px-3.5 py-2 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "border border-stone-300 text-stone-700 hover:bg-stone-50",
      )}
    >
      {children}
    </button>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600",
      )}
    >
      {active ? "Active" : "Hidden"}
    </span>
  );
}

export function firstString(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}
