import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Presentation } from "lucide-react";

export const metadata: Metadata = { title: "Create an account" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RegisterChoicePage({ searchParams }: { searchParams: SearchParams }) {
  const qs = new URLSearchParams(
    Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string"),
  ).toString();

  const options = [
    {
      href: `/register/student${qs ? `?${qs}` : ""}`,
      icon: GraduationCap,
      title: "I'm a student",
      body: "Register for tutorials, upload your timetable, pay for your package and get matched with a tutor.",
    },
    {
      href: "/register/tutor",
      icon: Presentation,
      title: "I want to tutor",
      body: "Apply to teach. Tell us your courses and availability; our team reviews every application.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-brand-950">Create an account</h1>
      <p className="mt-2 text-slate-600">Choose how you&apos;ll use Learning Hub Africa.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
          >
            <o.icon className="size-11 rounded-xl bg-brand-50 p-2.5 text-brand-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{o.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{o.body}</p>
            <span className="mt-5 flex items-center gap-1 text-sm font-semibold text-brand-700">
              Continue <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
