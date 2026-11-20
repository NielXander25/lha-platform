import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { logout, resendVerificationCode } from "@/app/actions/auth";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { needsEmailVerification } from "@/lib/verification";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!needsEmailVerification(user)) redirect(homeFor(user.role));
  const { sent, error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <MailCheck className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-brand-950">Check your email</h1>
      <p className="mt-2 text-slate-600">
        We sent a 6-digit code to <strong className="break-all text-slate-900">{user.email}</strong>. Enter it below to confirm it&apos;s you.
      </p>
      {sent && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">A new code is on its way.</p>}
      {typeof error === "string" && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7">
        <VerifyForm />
      </div>
      <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
        <p>Can&apos;t find it? Check your spam or promotions folder.</p>
        <form action={resendVerificationCode}>
          <button className="font-semibold text-brand-700 underline">Send a new code</button>
        </form>
        <form action={logout}>
          <button className="text-slate-500 underline">Wrong email? Log out and sign up again</button>
        </form>
      </div>
    </div>
  );
}
