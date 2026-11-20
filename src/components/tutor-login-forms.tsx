"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { addTutor, issueTutorPassword, type TutorLoginState } from "@/app/admin/actions";
import { Field, inputClass, SubmitButton } from "@/components/admin-ui";

/** Shows a freshly issued temporary password once, with a copy button. */
function IssuedLogin({ issued, showLink }: { issued: NonNullable<TutorLoginState["issued"]>; showLink?: boolean }) {
  const [copied, setCopied] = useState(false);
  const message = `Hi ${issued.name.split(" ")[0]}, your Learning Hub Africa tutor login:\nEmail: ${issued.email}\nTemporary password: ${issued.password}\nLog in at ${window.location.origin}/login and choose your own password.`;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-semibold">{issued.created ? `Login created for ${issued.name}.` : `New password issued for ${issued.name}.`}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt>Email</dt><dd className="break-all font-medium">{issued.email}</dd>
        <dt>Temporary password</dt><dd className="font-mono text-base font-semibold tracking-wide">{issued.password}</dd>
      </dl>
      <p className="mt-2">
        {issued.emailed ? "We've emailed these details to the tutor." : "Email isn't set up, so send these details to the tutor yourself (for example on WhatsApp)."}{" "}
        They&apos;ll choose their own password when they first log in. This password won&apos;t be shown again.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(message).then(() => setCopied(true))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy message"}
        </button>
        {showLink && <Link href={`/admin/tutors/${issued.tutorId}`} className="self-center font-semibold underline">Open tutor</Link>}
      </div>
    </div>
  );
}

export function AddTutorForm() {
  const [state, action] = useActionState<TutorLoginState, FormData>(addTutor, {});
  return (
    <>
      <form action={action} className="grid gap-4 sm:grid-cols-3">
        <Field label="Full name"><input name="name" required className={inputClass} /></Field>
        <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
        <Field label="Phone"><input name="phone" type="tel" className={inputClass} /></Field>
        <div className="sm:col-span-3"><SubmitButton>Add tutor and create login</SubmitButton></div>
      </form>
      {state.error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state.issued && <IssuedLogin issued={state.issued} showLink />}
    </>
  );
}

export function TutorLoginPanel({ tutorId, hasLogin, lastLogin }: { tutorId: string; hasLogin: boolean; lastLogin: string | null }) {
  const [state, action] = useActionState<TutorLoginState, FormData>(issueTutorPassword, {});
  return (
    <div>
      <p className="mt-1 text-sm text-slate-600">
        {hasLogin
          ? lastLogin ? `Has a login. Last logged in ${lastLogin}.` : "Has a login but hasn't logged in yet."
          : "No login yet. Create one so this tutor can set their courses and availability, and accept students."}
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="tutorId" value={tutorId} />
        <SubmitButton variant={hasLogin ? "ghost" : "primary"}>{hasLogin ? "Reset password" : "Create login"}</SubmitButton>
      </form>
      {state.error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state.issued && <IssuedLogin issued={state.issued} />}
    </div>
  );
}
