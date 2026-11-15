import type { PricingTier } from "@prisma/client";
import { User, UserPlus, Users } from "lucide-react";
import { PRICE_UNIT } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

const icons = [Users, UserPlus, User];

// Large cards for the home page.
export function PricingCards({ tiers }: { tiers: PricingTier[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {tiers.map((tier, i) => {
        const Icon = icons[Math.min(i, icons.length - 1)];
        const featured = i === tiers.length - 1;
        return (
          <div
            key={tier.id}
            className={cn(
              "flex flex-col rounded-3xl border p-7",
              featured ? "border-brand-600 bg-brand-900 text-white" : "border-stone-200 bg-white",
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
          </div>
        );
      })}
    </div>
  );
}

// Compact list for the course page sidebar.
export function PricingList({ tiers }: { tiers: PricingTier[] }) {
  return (
    <ul className="divide-y divide-stone-100">
      {tiers.map((tier) => (
        <li key={tier.id} className="flex items-center justify-between gap-4 py-3.5">
          <div>
            <p className="font-semibold text-stone-900">{tier.name}</p>
            <p className="text-sm text-stone-500">{tier.ratio}</p>
          </div>
          <p className="font-display text-2xl font-semibold text-stone-900">{formatPrice(tier.price)}</p>
        </li>
      ))}
    </ul>
  );
}
