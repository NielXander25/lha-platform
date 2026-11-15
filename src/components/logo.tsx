import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <Image src="/logo.png" alt="" width={44} height={44} priority className="size-11 shrink-0" />
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
