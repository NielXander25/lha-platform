"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerStudent, registerTutor, type FormState } from "@/app/actions/auth";
import { FormError, Submit, TextField } from "@/components/forms";

export function AccountForm({
  role,
  hidden = {},
}: {
  role: "STUDENT" | "TUTOR";
  hidden?: Record<string, string>;
}) {
  const [state, action] = useActionState<FormState, FormData>(role === "STUDENT" ? registerStudent : registerTutor, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-4">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <FormError message={state.error} />
      <TextField label="Full name" name="name" autoComplete="name" defaultValue={f.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" defaultValue={f.email} />
      <TextField label="Phone number" name="phone" type="tel" autoComplete="tel" defaultValue={f.phone} placeholder="e.g. 0803 123 4567" />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." />
      <label className="flex gap-3 text-sm text-slate-600">
        <input type="checkbox" name="consent" required defaultChecked={f.consent === "on"} className="mt-0.5 size-4 shrink-0 accent-brand-600" />
        <span>
          I agree that Learning Hub Africa may store and use the information I provide
          {role === "STUDENT" ? ", including my academic details and timetable," : ", including my qualifications and availability,"} to
          organise tutorials, in line with the Nigeria Data Protection Act.
          {role === "STUDENT" && " I understand my uploaded timetable is read by an automated AI service to fill in my lectures, which I then check."}
        </span>
      </label>
      <Submit className="w-full">Create account</Submit>
      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
