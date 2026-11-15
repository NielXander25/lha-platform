import Link from "next/link";
import type { PricingTier } from "@prisma/client";
import { ArrowRight, User, UserPlus, Users } from "lucide-react";
import { PRICE_UNIT } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

const icons = [Users, UserPlus, User];
const iconFor = (i: number) => icons[Math.min(i, icons.length - 1)];

// Large clickable cards (home page). `href` decides where a tier leads.
export function PricingCards({
  tiers,
  href,
  cta,
}: {
  tiers: PricingTier[];
  href: (tier: PricingTier) => string;
  cta: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {tiers.map((tier, i) => {
        const Icon = iconFor(i);
        const featured = i === tiers.length - 1;
        return (
          <Link
            key={tier.id}
            href={href(tier)}
            className={cn(
              "group flex flex-col rounded-3xl border p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10",
              featured
                ? "border-brand-600 bg-brand-900 text-white"
                : "border-stone-200 bg-white hover:border-brand-300",
            )}
          >
            <Icon className={cn("size-10 rounded-xl p-2", featured ? "bg-white/10 text-sun-300" : "bg-brand-50 text-brand-600")} />
            <h3 className="mt-5 font-display text-2xl font-semibold">{tier.name}</h3>
            <p className={cn("mt-1 text-sm font-semibold", featured ? "text-sun-300" : "text-sun-600")}>{tier.ratio}</p>
            <p className={cn("mt-3 flex-1 text-sm leading-relaxed", featured ? "text-brand-100/80" : "text-stone-600")}>
              {tier.description}
            </p>
            <p className="mt-6">
              <span className="font-display text-4xl font-semibold">{formatPrice(tier.price)}</span>
              <span className={cn("text-sm", featured ? "text-brand-100/70" : "text-stone-500")}> {PRICE_UNIT}</span>
            </p>
            <span
              className={cn(
                "mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                featured ? "bg-sun-400 text-brand-950 group-hover:bg-sun-300" : "bg-brand-600 text-white group-hover:bg-brand-700",
              )}
            >
              {cta} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// Compact clickable cards (course page sidebar). Each leads to checkout for that tier.
export function PricingOptions({ tiers, href }: { tiers: PricingTier[]; href: (tier: PricingTier) => string }) {
  return (
    <ul className="space-y-3">
      {tiers.map((tier, i) => {
        const Icon = iconFor(i);
        return (
          <li key={tier.id}>
            <Link
              href={href(tier)}
              className="group flex items-center gap-4 rounded-2xl border border-stone-200 p-4 transition hover:border-brand-500 hover:bg-brand-50"
            >
              <Icon className="size-10 shrink-0 rounded-xl bg-brand-50 p-2 text-brand-600 group-hover:bg-white" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-stone-900">{tier.name}</span>
                <span className="block text-sm text-stone-500">{tier.ratio}</span>
              </span>
              <span className="text-right">
                <span className="block font-display text-2xl font-semibold text-stone-900">{formatPrice(tier.price)}</span>
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-brand-700">
                  Pay <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
