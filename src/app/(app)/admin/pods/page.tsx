import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createPod, createPodSession } from "./actions";

export default async function AdminPodsPage() {
  const pods = await prisma.pod.findMany({
    include: { members: true, sessions: { orderBy: { week: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Pods</h1>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Create a pod</div>
        <form action={createPod} className="mt-3 flex gap-2">
          <input name="name" required placeholder="e.g. Pod 1 — Baobab" className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary">Create</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {pods.map((pod) => {
          const rep = pod.members.find((m) => m.isPodRepresentative);
          const lastSession = pod.sessions[0];
          const boundSession = createPodSession.bind(null, pod.id);
          return (
            <Card key={pod.id}>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg text-[var(--color-navy)]">{pod.name}</div>
                <Badge tone="neutral">{pod.members.length} members</Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink)]/60">
                Rep: {rep?.fullName ?? "Not set"}
              </p>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy)]">
                  Post this week&apos;s discussion (last posted: week {lastSession?.week ?? "—"})
                </summary>
                <form action={boundSession} className="mt-3 space-y-2">
                  <input name="week" type="number" required placeholder="Week number" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <input name="caseStudyUrl" placeholder="Case study link" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <textarea name="discussionQuestions" placeholder={"One discussion question per line"} rows={3} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <Button type="submit" variant="secondary">Post</Button>
                </form>
              </details>
            </Card>
          );
        })}
        {pods.length === 0 && <p className="text-sm text-[var(--color-ink)]/50">No pods yet.</p>}
      </div>
    </div>
  );
}
