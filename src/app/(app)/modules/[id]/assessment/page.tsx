import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitAssessment } from "./actions";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const mod = await prisma.module.findUnique({
    where: { id },
    include: { assessment: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!mod?.assessment) notFound();

  const previous = await prisma.assessmentSubmission.findFirst({
    where: { assessmentId: mod.assessment.id, userId: session!.user.id },
    orderBy: { attemptNumber: "desc" },
  });

  const alreadyDone = previous?.status === "SUBMITTED" || previous?.status === "GRADED";

  const boundSubmit = submitAssessment.bind(null, mod.assessment.id, mod.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-gold)]">
          Module {String(mod.number).padStart(2, "0")} Assessment
        </div>
        <h1 className="font-display text-2xl text-[var(--color-navy)]">{mod.assessment.title}</h1>
      </div>

      {alreadyDone ? (
        <Card>
          <p className="text-sm text-[var(--color-ink)]/70">
            You&apos;ve already submitted this assessment.
            {previous?.score != null && ` Score: ${previous.score}/${previous.maxScore}.`}
          </p>
        </Card>
      ) : (
        <form action={boundSubmit} className="space-y-5">
          {mod.assessment.questions.map((q, idx) => {
            const options = (q.options as { id: string; text: string }[] | null) ?? [];
            return (
              <Card key={q.id}>
                <div className="mb-3 text-sm font-medium">
                  {idx + 1}. {q.prompt}
                </div>
                {q.type === "MULTIPLE_CHOICE" &&
                  options.map((o) => (
                    <label key={o.id} className="mb-2 flex items-center gap-2 text-sm">
                      <input type="radio" name={q.id} value={o.id} required className="accent-[var(--color-navy)]" />
                      {o.text}
                    </label>
                  ))}
                {q.type === "MULTIPLE_ANSWER" &&
                  options.map((o) => (
                    <label key={o.id} className="mb-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" name={q.id} value={o.id} className="accent-[var(--color-navy)]" />
                      {o.text}
                    </label>
                  ))}
                {(q.type === "SHORT_ANSWER" || q.type === "SCENARIO") && (
                  <input
                    name={q.id}
                    type="text"
                    required
                    className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                  />
                )}
                {q.type === "LONG_ANSWER" && (
                  <textarea
                    name={q.id}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                  />
                )}
              </Card>
            );
          })}
          <Button type="submit">Submit assessment</Button>
        </form>
      )}
    </div>
  );
}
