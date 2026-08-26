import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { updateCompletionStatus, updatePaidStatus } from "./actions";

export default async function AdminCertificatesPage() {
  const participants = await prisma.user.findMany({
    where: { role: "PARTICIPANT" },
    include: { certificate: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Certificates</h1>
      <Card className="!p-0">
        <div className="divide-y divide-[var(--color-line)]">
          {participants.map((p) => {
            const boundCompletion = updateCompletionStatus.bind(null, p.id);
            const boundPaid = updatePaidStatus.bind(null, p.id);
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="text-sm font-medium">{p.fullName}</div>
                <div className="flex flex-wrap gap-2">
                  <form action={async (fd: FormData) => { "use server"; await boundCompletion(fd.get("s") as never); }} className="flex items-center gap-1">
                    <select name="s" defaultValue={p.certificate?.completionStatus ?? "NOT_ELIGIBLE"} className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-xs">
                      <option value="NOT_ELIGIBLE">Not eligible</option>
                      <option value="ELIGIBLE">Eligible</option>
                      <option value="ISSUED">Issued</option>
                    </select>
                    <button type="submit" className="rounded-lg bg-[var(--color-navy)] px-2 py-1.5 text-xs text-white">Save</button>
                  </form>
                  <form action={async (fd: FormData) => { "use server"; await boundPaid(fd.get("s") as never); }} className="flex items-center gap-1">
                    <select name="s" defaultValue={p.certificate?.paidStatus ?? "NOT_REQUESTED"} className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-xs">
                      <option value="NOT_REQUESTED">Not requested</option>
                      <option value="REQUESTED">Requested</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="ISSUED">Issued</option>
                    </select>
                    <button type="submit" className="rounded-lg bg-[var(--color-gold)] px-2 py-1.5 text-xs text-[var(--color-ink)]">Save</button>
                  </form>
                </div>
              </div>
            );
          })}
          {participants.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink)]/50">No participants yet.</p>}
        </div>
      </Card>
    </div>
  );
}
