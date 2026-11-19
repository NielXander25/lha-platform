"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/auth";
import { FormError, Submit, TextField } from "@/components/forms";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state.error} />
      <TextField label="Email" name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" />
      <Submit className="w-full">Log in</Submit>
    </form>
  );
}
