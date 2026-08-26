"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitAssessment(assessmentId: string, moduleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const userId = session.user.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: true },
  });
  if (!assessment) throw new Error("Assessment not found");

  const answers: Record<string, string | string[]> = {};
  let score = 0;
  let maxScore = 0;

  for (const q of assessment.questions) {
    if (q.type === "MULTIPLE_CHOICE") {
      maxScore += 1;
      const val = formData.get(q.id) as string | null;
      if (val) answers[q.id] = val;
      const correct = q.correctAnswer as string | null;
      if (correct && val === correct) score += 1;
    } else if (q.type === "MULTIPLE_ANSWER") {
      maxScore += 1;
      const vals = formData.getAll(q.id) as string[];
      answers[q.id] = vals;
      const correct = (q.correctAnswer as string[] | null) ?? [];
      const isMatch =
        correct.length === vals.length && correct.every((c) => vals.includes(c));
      if (isMatch) score += 1;
    } else {
      const val = formData.get(q.id) as string | null;
      if (val) answers[q.id] = val;
      // subjective — not auto-scored, flagged for manual review
    }
  }

  const existingCount = await prisma.assessmentSubmission.count({
    where: { assessmentId, userId },
  });

  const hasSubjective = assessment.questions.some(
    (q) => q.type === "SHORT_ANSWER" || q.type === "LONG_ANSWER" || q.type === "SCENARIO"
  );

  await prisma.assessmentSubmission.create({
    data: {
      assessmentId,
      userId,
      answers,
      score,
      maxScore,
      status: hasSubjective ? "SUBMITTED" : "GRADED",
      attemptNumber: existingCount + 1,
      submittedAt: new Date(),
      gradedAt: hasSubjective ? null : new Date(),
    },
  });

  revalidatePath(`/modules/${moduleId}`);
  revalidatePath(`/modules/${moduleId}/assessment`);
  revalidatePath("/dashboard");
}
