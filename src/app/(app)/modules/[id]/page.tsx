import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const mod = await prisma.module.findUnique({
    where: { id },
    include: { resources: true, facilitator: true, assessment: true },
  });
  if (!mod) notFound();

  const submission = mod.assessment
    ? await prisma.assessmentSubmission.findFirst({
        where: { assessmentId: mod.assessment.id, userId: session!.user.id },
        orderBy: { attemptNumber: "desc" },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-gold)]">
          Module {String(mod.number).padStart(2, "0")}
        </div>
        <h1 className="font-display text-2xl text-[var(--color-navy)]">{mod.title}</h1>
        {mod.facilitator && (
          <p className="mt-1 text-sm text-[var(--color-ink)]/60">Facilitated by {mod.facilitator.fullName}</p>
        )}
      </div>

      {mod.description && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Overview</div>
          <p className="mt-2 text-sm text-[var(--color-ink)]/80">{mod.description}</p>
          {mod.learningObjectives && (
            <p className="mt-2 text-sm text-[var(--color-ink)]/70">
              <span className="font-medium">Objectives: </span>
              {mod.learningObjectives}
            </p>
          )}
        </Card>
      )}

      {mod.meetingLink && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live session</span>
            <Button href={mod.meetingLink}>Join session</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Resources</div>
        {mod.resources.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ink)]/50">No resources uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mod.resources.map((r) => (
              <li key={r.id}>
                <a href={r.url} className="text-sm text-[var(--color-navy)] underline">
                  {r.title} <span className="text-[var(--color-ink)]/40">({r.type})</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {mod.recordingUrl && (
          <a href={mod.recordingUrl} className="mt-3 block text-sm text-[var(--color-navy)] underline">
            Session recording
          </a>
        )}
      </Card>

      {mod.reflectionPrompt && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Reflection</div>
          <p className="mt-2 text-sm text-[var(--color-ink)]/80">{mod.reflectionPrompt}</p>
        </Card>
      )}

      {mod.assessment && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Assessment</div>
              {submission?.status === "SUBMITTED" || submission?.status === "GRADED" ? (
                <p className="mt-1 text-sm text-[var(--color-ink)]/70">
                  Completed{submission.score != null ? ` · Score ${submission.score}/${submission.maxScore}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--color-ink)]/70">Not yet completed</p>
              )}
            </div>
            <Button href={`/modules/${mod.id}/assessment`}>
              {submission?.status === "SUBMITTED" || submission?.status === "GRADED" ? "Review" : "Take assessment"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
