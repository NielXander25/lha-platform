import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { submitNugget, submitPodFeedback } from "./actions";

export default async function PodPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { pod: { include: { members: true, sessions: { orderBy: { week: "desc" } }, nuggets: { orderBy: { createdAt: "desc" }, take: 5 } } } },
  });

  if (!user?.pod) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl text-[var(--color-navy)]">My pod</h1>
        <p className="text-sm text-[var(--color-ink)]/60">You haven&apos;t been assigned to a pod yet.</p>
      </div>
    );
  }

  const pod = user.pod;
  const rep = pod.members.find((m) => m.isPodRepresentative);
  const latestSession = pod.sessions[0];
  const isRep = user.isPodRepresentative;
  const currentWeek = latestSession?.week ?? 1;

  const boundNugget = isRep ? submitNugget.bind(null, pod.id, currentWeek) : null;
  const boundFeedback = isRep ? submitPodFeedback.bind(null, pod.id, currentWeek) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-[var(--color-navy)]">{pod.name}</h1>
        {isRep && <Badge tone="gold">Pod Representative</Badge>}
      </div>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Pod members</div>
        <ul className="mt-3 divide-y divide-[var(--color-line)]">
          {pod.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span>{m.preferredName || m.fullName}</span>
              {m.id === rep?.id && <Badge tone="gold">Rep</Badge>}
            </li>
          ))}
        </ul>
      </Card>

      {latestSession && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Week {latestSession.week} — Pod discussion
          </div>
          {latestSession.caseStudyUrl && (
            <a href={latestSession.caseStudyUrl} className="mt-2 block text-sm text-[var(--color-navy)] underline">
              Case study
            </a>
          )}
          {Array.isArray(latestSession.discussionQuestions) && (
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--color-ink)]/70">
              {(latestSession.discussionQuestions as string[]).map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {isRep && boundNugget && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Submit Session Nugget — Week {currentWeek}
          </div>
          <form action={boundNugget} className="mt-3 space-y-3">
            <textarea
              name="content"
              required
              rows={3}
              placeholder="50–100 words summarising your pod's discussion"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
            <Button type="submit" variant="secondary">Submit nugget</Button>
          </form>
        </Card>
      )}

      {isRep && boundFeedback && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Pod feedback — Week {currentWeek}
          </div>
          <form action={boundFeedback} className="mt-3 space-y-3">
            <select name="engagementLevel" required className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">How engaged was your pod?</option>
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
              <option value="VERY_HIGH">Very High</option>
            </select>
            <textarea name="strongestPart" placeholder="Strongest part of the discussion" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <textarea name="standoutMoment" placeholder="Any standout question, disagreement, or insight?" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <textarea name="strugglingNote" placeholder="Did anyone seem to be struggling to participate?" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <textarea name="otherNotes" placeholder="Anything else the programme team should know?" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <Button type="submit" variant="secondary">Submit pod feedback</Button>
          </form>
        </Card>
      )}

      {pod.nuggets.length > 0 && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Recent nuggets</div>
          <ul className="mt-3 space-y-3">
            {pod.nuggets.map((n) => (
              <li key={n.id} className="text-sm">
                <div className="text-xs text-[var(--color-ink)]/50">Week {n.week} · {formatDate(n.createdAt)}</div>
                <p className="text-[var(--color-ink)]/80">{n.content}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
