import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { ONBOARDING_STEPS } from "@/lib/students";
import { AccountForm } from "../account-form";

export const metadata: Metadata = { title: "Student registration" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function StudentRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const params = await searchParams;
  const hidden: Record<string, string> = {};
  for (const k of ["package", "course"]) if (typeof params[k] === "string") hidden[k] = params[k] as string;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Student registration</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">Let&apos;s get you a tutor</h1>
        <p className="mt-3 text-slate-600">
          Create your account first. Then we&apos;ll guide you through a few short steps:
        </p>
        <ol className="mt-6 space-y-3">
          {ONBOARDING_STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-3 text-slate-700">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                {i + 1}
              </span>
              {s.label}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-500">You can stop at any point and continue later by logging in.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7">
        <AccountForm hidden={hidden} />
      </div>
    </div>
  );
}
