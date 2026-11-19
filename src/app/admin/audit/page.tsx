import { PageHeader } from "@/components/admin-ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "medium", timeZone: "Africa/Lagos" });

export default async function AuditPage() {
  await requireUser(["ADMIN", "FINANCE"]);
  const logs = await prisma.auditLog.findMany({
    where: { action: { not: "auth.login_failed" } },
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Audit log" description="The latest 200 administrative and financial actions. Entries can't be edited or deleted." />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{dateFmt.format(l.createdAt)}</td>
                <td className="px-4 py-2.5">{l.actor ? <>{l.actor.name}<br /><span className="text-xs text-slate-500">{l.actor.role.toLowerCase()}</span></> : <span className="text-slate-500">System</span>}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-800">{l.action}</td>
                <td className="max-w-md break-all px-4 py-2.5 font-mono text-xs text-slate-500">{l.details ? JSON.stringify(l.details) : `${l.entity} ${l.entityId ?? ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
