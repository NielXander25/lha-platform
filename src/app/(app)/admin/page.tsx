import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export default async function AdminOverviewPage() {
  const [total, active, completed, withdrawn, podsCount, modulesCount, submissionsCount, paidRequests] =
    await Promise.all([
      prisma.user.count({ where: { role: "PARTICIPANT" } }),
      prisma.user.count({ where: { role: "PARTICIPANT", programmeStatus: "ACTIVE" } }),
      prisma.user.count({ where: { role: "PARTICIPANT", programmeStatus: "COMPLETED" } }),
      prisma.user.count({ where: { role: "PARTICIPANT", programmeStatus: "WITHDRAWN" } }),
      prisma.pod.count(),
      prisma.module.count(),
      prisma.assessmentSubmission.count({ where: { status: { in: ["SUBMITTED", "GRADED"] } } }),
      prisma.certificate.count({ where: { paidStatus: { not: "NOT_REQUESTED" } } }),
    ]);

  const stats = [
    { label: "Total participants", value: total },
    { label: "Active", value: active },
    { label: "Completed", value: completed },
    { label: "Withdrawn", value: withdrawn },
    { label: "Pods", value: podsCount },
    { label: "Modules published", value: modulesCount },
    { label: "Assessment submissions", value: submissionsCount },
    { label: "Paid certificate requests", value: paidRequests },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Cohort overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="font-display text-3xl text-[var(--color-navy)]">{s.value}</div>
            <div className="mt-1 text-xs text-[var(--color-ink)]/60">{s.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
