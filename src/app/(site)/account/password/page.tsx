import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { needsEmailVerification } from "@/lib/verification";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (needsEmailVerification(user)) redirect("/verify-email");
  const temporary = user.mustChangePassword;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <KeyRound className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-brand-950">{temporary ? "Choose your password" : "Change password"}</h1>
      <p className="mt-2 text-slate-600">
        {temporary
          ? "You logged in with a temporary password. Choose your own to continue; only you will know it."
          : "Enter your current password, then the new one."}
      </p>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7">
        <PasswordForm temporary={temporary} />
      </div>
      {!temporary && (
        <p className="mt-6 text-center text-sm">
          <Link href={homeFor(user.role)} className="text-slate-500 underline">Back to my dashboard</Link>
        </p>
      )}
    </div>
  );
}
