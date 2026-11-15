import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 font-display text-lg font-bold text-sun-300">
        L
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold leading-none tracking-tight",
          light ? "text-white" : "text-brand-900",
        )}
      >
        {SITE.name}
      </span>
    </Link>
  );
}
