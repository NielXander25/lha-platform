import { createStaff, setUserActive } from "../actions";
import { Card, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { FlashMessage, StatusBadge } from "@/components/portal-ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrator", FINANCE: "Finance officer", SUPPORT: "Support officer" };

export default async function StaffPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireUser(["ADMIN"]);
  const params = await searchParams;
  const staff = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "FINANCE", "SUPPORT"] } }, orderBy: [{ role: "asc" }, { name: "asc" }] });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Staff accounts" description="Administrators, finance officers and support officers." />
      <FlashMessage ok={firstString(params.ok)} error={firstString(params.error)} />
      <Card className="divide-y divide-slate-100">
        {staff.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium text-slate-900">{u.name} {u.id === me.id && <span className="text-xs text-slate-500">(you)</span>}</p>
              <p className="text-sm text-slate-500">{u.email} · {ROLE_LABEL[u.role]}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge label={u.active ? "Active" : "Deactivated"} tone={u.active ? "good" : "neutral"} />
              {u.id !== me.id && (
                <form action={setUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={String(!u.active)} />
                  <button className="text-xs font-semibold text-brand-700 hover:underline">{u.active ? "Deactivate" : "Reactivate"}</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">Add a staff member</h2>
      <Card className="p-5">
        <form action={createStaff} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input name="name" required className={inputClass} /></Field>
          <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
          <Field label="Role">
            <select name="role" defaultValue="SUPPORT" className={inputClass}>
              <option value="SUPPORT">Support officer</option>
              <option value="FINANCE">Finance officer</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </Field>
          <Field label="Temporary password"><input name="password" type="text" required minLength={10} autoComplete="off" className={inputClass} /></Field>
          <div><SubmitButton>Create account</SubmitButton></div>
        </form>
        <p className="mt-3 text-xs text-slate-500">Share the temporary password privately. Password changes and email resets arrive with the notifications module.</p>
      </Card>
    </div>
  );
}
