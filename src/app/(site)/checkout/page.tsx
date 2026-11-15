import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, MessageCircle } from "lucide-react";
import { PRICE_UNIT, whatsappLink } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Payment step for one course at one pricing tier.
// Online payment (Paystack) is not connected yet: the pay button is a placeholder.
export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const slug = typeof params.course === "string" ? params.course : "";
  const tierId = typeof params.tier === "string" ? params.tier : "";

  const [course, tier] = await Promise.all([
    prisma.course.findFirst({ where: { slug, active: true } }),
    prisma.pricingTier.findUnique({ where: { id: tierId } }),
  ]);
  if (!course || !tier) notFound();

  const courseName = course.code ? `${course.code}: ${course.title}` : course.title;
  const message = `Hello Learning Hub Africa, I'd like to pay for ${courseName} (${tier.name}, ${formatPrice(tier.price)}).`;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link href={`/tutorials/${course.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> Back to {course.code ?? "course"}
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-brand-950">Checkout</h1>

      <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5">
        <dl className="divide-y divide-stone-100 text-sm">
          <div className="flex justify-between gap-6 py-3">
            <dt className="text-stone-500">Course</dt>
            <dd className="text-right font-semibold text-stone-900">{courseName}</dd>
          </div>
          <div className="flex justify-between gap-6 py-3">
            <dt className="text-stone-500">Level</dt>
            <dd className="text-right font-semibold text-stone-900">{course.level}</dd>
          </div>
          <div className="flex justify-between gap-6 py-3">
            <dt className="text-stone-500">Class size</dt>
            <dd className="text-right">
              <span className="block font-semibold text-stone-900">{tier.name}</span>
              <span className="text-stone-500">{tier.ratio}</span>
            </dd>
          </div>
          <div className="flex items-end justify-between gap-6 pt-4">
            <dt className="font-semibold text-stone-900">Total</dt>
            <dd className="text-right">
              <span className="font-display text-3xl font-semibold text-stone-900">{formatPrice(tier.price)}</span>
              <span className="block text-xs text-stone-500">{PRICE_UNIT}</span>
            </dd>
          </div>
        </dl>

        <button
          type="button"
          disabled
          className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 font-semibold text-white opacity-50"
        >
          <Lock className="size-4" /> Pay {formatPrice(tier.price)} with Paystack
        </button>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          Online payment is coming soon. For now, message us to pay and secure your place.
        </p>

        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          <MessageCircle className="size-5" /> Pay via WhatsApp for now
        </a>
      </div>

      <p className="mt-6 text-center text-sm text-stone-500">
        Want a different class size?{" "}
        <Link href={`/tutorials/${course.slug}`} className="font-semibold text-brand-700 underline">
          Change option
        </Link>
      </p>
    </div>
  );
}
