"use client";

import { useActionState } from "react";
import { verifyEmail, type FormState } from "@/app/actions/auth";
import { FormError, Submit } from "@/components/forms";
import { fieldClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function VerifyForm() {
  const [state, action] = useActionState<FormState, FormData>(verifyEmail, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">6-digit code</span>
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          placeholder="123456"
          autoFocus
          className={cn(fieldClass, "mt-1.5 text-center font-display text-2xl tracking-[0.4em]")}
        />
      </label>
      <Submit className="w-full">Confirm email</Submit>
    </form>
  );
}
