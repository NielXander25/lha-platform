import type { Metadata } from "next";
import Link from "next/link";
import { Presentation } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/constants";

export const metadata: Metadata = { title: "Tutor accounts", robots: { index: false } };

// Tutors can't sign up here; an LHA administrator creates their account.
export default function TutorAccountsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Presentation className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-brand-950">Tutor accounts</h1>
      <p className="mt-2 text-slate-600">
        Tutor accounts are created by the {SITE.name} team. If you tutor with us, you&apos;ll receive your login details from us.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className="rounded-full bg-brand-600 px-5 py-3 text-center font-semibold text-white hover:bg-brand-700">
          Log in
        </Link>
        <a href={whatsappLink("Hello, I'd like to tutor with Learning Hub Africa.")} className="rounded-full border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:border-brand-300">
          Contact us
        </a>
      </div>
    </div>
  );
}
