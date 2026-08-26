import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { auth } from "@/lib/auth";

function isUnlocked(m: { availability: string; availableFrom: Date | null; manuallyUnlocked: boolean }) {
  if (m.availability === "MANUAL") return m.manuallyUnlocked;
  if (!m.availableFrom) return true;
  return new Date(m.availableFrom) <= new Date();
}

export default async function ModulesPage() {
  const session = await auth();
  const modules = await prisma.module.findMany({ orderBy: { number: "asc" } });
  const submissions = await prisma.assessmentSubmission.findMany({
    where: { userId: session!.user.id },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Modules</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => {
          const unlocked = isUnlocked(m);
          const sub = submissions.find((s) => s.status === "SUBMITTED" || s.status === "GRADED");
          return (
            <Card key={m.id} className={!unlocked ? "opacity-60" : ""}>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-gold)]">
                Module {String(m.number).padStart(2, "0")}
              </div>
              <div className="mt-1 font-display text-lg text-[var(--color-navy)]">{m.title}</div>
              <div className="mt-3">
                {!unlocked ? (
                  <Badge tone="neutral">Locked</Badge>
                ) : sub ? (
                  <Badge tone="ok">Completed</Badge>
                ) : (
                  <Badge tone="warn">In progress</Badge>
                )}
              </div>
              {unlocked && (
                <Link href={`/modules/${m.id}`} className="mt-4 inline-block text-sm font-medium text-[var(--color-navy)] underline">
                  Open module
                </Link>
              )}
            </Card>
          );
        })}
        {modules.length === 0 && (
          <p className="text-sm text-[var(--color-ink)]/50">No modules published yet.</p>
        )}
      </div>
    </div>
  );
}
