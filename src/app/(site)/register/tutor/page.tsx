import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { AccountForm } from "../account-form";

export const metadata: Metadata = { title: "Tutor application" };

export default async function TutorRegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  const steps = [
    "Create your account",
    "Add your qualifications, experience and credentials",
    "Choose the courses you can teach",
    "Set your weekly availability and workload",
    "Our team reviews and approves your profile",
  ];

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Tutor application</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">Teach with Learning Hub</h1>
        <p className="mt-3 text-slate-600">Help AFIT students master their courses, on a schedule that suits you.</p>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-slate-700">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7">
        <AccountForm role="TUTOR" />
      </div>
    </div>
  );
}
