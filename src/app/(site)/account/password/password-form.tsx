"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/app/actions/auth";
import { FormError, Submit, TextField } from "@/components/forms";

export function PasswordForm({ temporary }: { temporary: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <TextField label={temporary ? "Temporary password" : "Current password"} name="current" type="password" autoComplete="current-password" />
      <TextField label="New password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." />
      <TextField label="Type the new password again" name="confirm" type="password" autoComplete="new-password" />
      <Submit className="w-full">Save password</Submit>
    </form>
  );
}
