import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pod: true },
  });

  const totalModules = await prisma.module.count();
  const submissions = await prisma.assessmentSubmission.findMany({
    where: { userId, status: { in: ["SUBMITTED", "GRADED"] } },
  });
  const completedModules = submissions.length;
  const progressPct = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  const nextEvent = await prisma.calendarEvent.findFirst({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const nextPodSession = user?.podId
    ? await prisma.podSession.findFirst({
        where: { podId: user.podId },
        orderBy: { week: "desc" },
      })
    : null;

  const pendingAssessments = await prisma.assessment.findMany({
    where: { submissions: { none: { userId, status: { in: ["SUBMITTED", "GRADED"] } } } },
    include: { module: true },
    take: 3,
  });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-navy)]">
          Welcome, {user?.preferredName || user?.fullName}
        </h1>
        <p className="text-sm text-[var(--color-ink)]/60">Here&apos;s where the programme stands for you.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Programme progress</span>
          <span className="text-[var(--color-ink)]/60">
            {completedModules} of {totalModules} modules complete
          </span>
        </div>
        <div className="progress-track mt-3 h-2.5 w-full">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Upcoming session
          </div>
          {nextEvent ? (
            <>
              <div className="mt-2 font-display text-lg text-[var(--color-navy)]">{nextEvent.title}</div>
              <p className="mt-1 text-sm text-[var(--color-ink)]/60">
                {formatDate(nextEvent.date)} {nextEvent.time ? `· ${nextEvent.time}` : ""}
              </p>
              {nextEvent.meetingLink && (
                <div className="mt-3">
                  <Button href={nextEvent.meetingLink}>Join session</Button>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink)]/50">No upcoming session scheduled yet.</p>
          )}
        </Card>

        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Your pod
          </div>
          {user?.pod ? (
            <>
              <div className="mt-2 font-display text-lg text-[var(--color-navy)]">{user.pod.name}</div>
              <p className="mt-1 text-sm text-[var(--color-ink)]/60">
                {nextPodSession ? `Latest: Week ${nextPodSession.week} discussion` : "No pod session posted yet"}
              </p>
              <div className="mt-3">
                <Button href="/pod" variant="secondary">View pod</Button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink)]/50">You haven&apos;t been assigned a pod yet.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Pending tasks
        </div>
        {pendingAssessments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink)]/50">You&apos;re all caught up.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pendingAssessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm">
                <span>
                  Module {a.module.number} assessment &mdash; {a.title}
                </span>
                <Badge tone="warn">Pending</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Recent announcements
        </div>
        {announcements.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink)]/50">Nothing posted yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {announcements.map((a) => (
              <li key={a.id}>
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-[var(--color-ink)]/50">{formatDate(a.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
