import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { acknowledgePolicy } from "./actions";

export default async function PoliciesPage() {
  const session = await auth();
  const policies = await prisma.policy.findMany({
    include: { acknowledgements: { where: { userId: session!.user.id } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Programme policies</h1>
      <div className="space-y-3">
        {policies.length === 0 && <p className="text-sm text-[var(--color-ink)]/50">No policies published yet.</p>}
        {policies.map((p) => {
          const ack = p.acknowledgements[0];
          const boundAck = acknowledgePolicy.bind(null, p.id);
          return (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg text-[var(--color-navy)]">{p.title}</div>
                  <p className="mt-1 text-sm text-[var(--color-ink)]/70">{p.content}</p>
                </div>
                {ack ? (
                  <Badge tone="ok">Accepted {formatDate(ack.acceptedAt)}</Badge>
                ) : (
                  <Badge tone="warn">Pending</Badge>
                )}
              </div>
              {!ack && (
                <form action={boundAck} className="mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" required className="accent-[var(--color-navy)]" />
                    I have read and agree to the {p.title}.
                  </label>
                  <button type="submit" className="mt-2 rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-medium text-white">
                    Accept
                  </button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
