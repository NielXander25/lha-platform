import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { updateProgrammeStatus, assignPod, togglePodRep } from "../actions";

export default async function AdminParticipantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await prisma.user.findUnique({
    where: { id },
    include: {
      pod: true,
      submissions: { include: { assessment: { include: { module: true } } } },
      certificate: true,
      project: true,
    },
  });
  if (!participant) notFound();

  const pods = await prisma.pod.findMany({ orderBy: { name: "asc" } });

  const boundStatus = updateProgrammeStatus.bind(null, id);
  const boundPod = assignPod.bind(null, id);
  const boundRep = togglePodRep.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-navy)]">{participant.fullName}</h1>
        <p className="text-sm text-[var(--color-ink)]/60">{participant.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Status</div>
          <div className="mt-2"><Badge tone="neutral">{participant.programmeStatus}</Badge></div>
          <form action={async (fd: FormData) => { "use server"; await boundStatus(fd.get("status") as never); }} className="mt-3 flex gap-2">
            <select name="status" defaultValue={participant.programmeStatus} className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMPLETED">Completed</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
            <button type="submit" className="rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-medium text-white">Update</button>
          </form>
        </Card>

        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Pod</div>
          <p className="mt-2 text-sm">{participant.pod?.name ?? "Unassigned"}</p>
          <form action={async (fd: FormData) => { "use server"; await boundPod(fd.get("podId") as string); }} className="mt-3 flex gap-2">
            <select name="podId" defaultValue={participant.podId ?? ""} className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="submit" className="rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-medium text-white">Assign</button>
          </form>
          <form action={async (fd: FormData) => { "use server"; await boundRep(fd.get("isRep") === "on"); }} className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="isRep" defaultChecked={participant.isPodRepresentative} className="accent-[var(--color-navy)]" />
            <span>Pod representative</span>
            <button type="submit" className="ml-auto rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium">Save</button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Assessment submissions</div>
        {participant.submissions.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink)]/50">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {participant.submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span>Module {s.assessment.module.number} — {s.assessment.title}</span>
                <Badge tone={s.status === "GRADED" ? "ok" : "warn"}>
                  {s.status}{s.score != null ? ` · ${s.score}/${s.maxScore}` : ""}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Certificate</div>
        <p className="mt-2 text-sm">
          Completion: {participant.certificate?.completionStatus ?? "NOT_ELIGIBLE"} · Paid: {participant.certificate?.paidStatus ?? "NOT_REQUESTED"}
        </p>
      </Card>
    </div>
  );
}
