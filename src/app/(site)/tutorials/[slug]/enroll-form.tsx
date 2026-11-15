"use client";

import { useActionState } from "react";
import { enroll, type EnrollState } from "@/app/actions/enroll";
import { cn } from "@/lib/utils";

type LocationOption = { id: string; name: string; city: string; isOnline: boolean };

export function EnrollForm({ courseId, locations }: { courseId: string; locations: LocationOption[] }) {
  const [state, action, pending] = useActionState<EnrollState, FormData>(enroll, {});
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <Field label="Student's full name" name="name" defaultValue={v.name} error={state.errors?.name} autoComplete="name" />
      <Field label="Email (parent or student)" name="email" type="email" defaultValue={v.email} error={state.errors?.email} autoComplete="email" />
      <Field label="Phone number" name="phone" type="tel" defaultValue={v.phone} error={state.errors?.phone} autoComplete="tel" />

      <label className="block">
        <span className="text-sm font-medium text-stone-700">Preferred location</span>
        <select
          name="preferredLocationId"
          defaultValue={v.preferredLocationId ?? ""}
          className="mt-1.5 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">No preference</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.isOnline ? l.name : `${l.name} (${l.city})`}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-stone-700">
          Anything we should know? <span className="text-stone-400">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={v.notes}
          placeholder="Class, goals, preferred days and times…"
          className="mt-1.5 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </label>

      {state.errors?.form && <p className="text-sm text-rose-600">{state.errors.form}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Enrol now"}
      </button>
      <p className="text-center text-xs text-stone-500">
        No payment is taken yet. We&apos;ll contact you to confirm your tutor, location and schedule.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        type={type}
        name={name}
        required
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={cn(
          "mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2",
          error
            ? "border-rose-400 focus:ring-rose-500/20"
            : "border-stone-300 focus:border-brand-500 focus:ring-brand-500/20",
        )}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
