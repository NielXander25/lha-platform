import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Enrolment received" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EnrollSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { course: slug } = await searchParams;
  const course =
    typeof slug === "string"
      ? await prisma.course.findUnique({ where: { slug }, select: { title: true } })
      : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <CheckCircle2 className="mx-auto size-16 text-brand-500" />
      <h1 className="mt-6 font-display text-3xl font-semibold text-brand-950">Thank you, you&apos;re enrolled!</h1>
      <p className="mt-4 text-stone-600">
        We&apos;ve received your enrolment{course ? <> for <strong>{course.title}</strong></> : null}. Our team
        will assign a tutor and a location and contact you to confirm your schedule and payment.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/tutorials" className="rounded-full bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">
          Browse more tutorials
        </Link>
        <Link href="/" className="rounded-full px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50">
          Back home
        </Link>
      </div>
    </div>
  );
}
