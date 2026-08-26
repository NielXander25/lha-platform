import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-deep)]",
  secondary: "bg-white text-[var(--color-navy)] border border-[var(--color-line)] hover:bg-[var(--color-surface-alt)]",
  ghost: "text-[var(--color-navy)] hover:bg-[var(--color-surface-alt)]",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
};

export function Button({ className, variant = "primary", href, ...props }: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    className
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children as React.ReactNode}
      </Link>
    );
  }
  return <button className={classes} {...props} />;
}
