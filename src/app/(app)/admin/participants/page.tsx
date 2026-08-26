import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const statusTone: Record<string, "ok" | "neutral" | "danger"> = {
  ACTIVE: "ok",
  INACTIVE: "neutral",
  COMPLETED: "ok",
  WITHDRAWN: "danger",
};

export default async function AdminParticipantsPage() {
  const participants = await prisma.user.findMany({
    where: { role: { in: ["PARTICIPANT"] } },
    include: { pod: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Participants</h1>
      <Card className="!p-0">
        <div className="divide-y divide-[var(--color-line)]">
          {participants.map((p) => (
            <Link
              key={p.id}
              href={`/admin/participants/${p.id}`}
              className="flex items-center justify-between px-5 py-3 text-sm hover:bg-[var(--color-surface-alt)]"
            >
              <div>
                <div className="font-medium">{p.fullName}</div>
                <div className="text-xs text-[var(--color-ink)]/50">{p.email} · {p.pod?.name ?? "No pod"}</div>
              </div>
              <Badge tone={statusTone[p.programmeStatus]}>{p.programmeStatus}</Badge>
            </Link>
          ))}
          {participants.length === 0 && (
            <p className="px-5 py-6 text-sm text-[var(--color-ink)]/50">No participants added yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
