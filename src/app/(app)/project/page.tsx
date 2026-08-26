import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { saveProject } from "./actions";

export default async function ProjectPage() {
  const session = await auth();
  const project = await prisma.project.findUnique({
    where: { ownerId: session!.user.id },
    include: {
      milestoneProgress: { include: { milestone: true }, orderBy: { milestone: { week: "asc" } } },
      mentorAssignment: { include: { mentor: true } },
    },
  });

  const milestones = await prisma.milestone.findMany({ orderBy: { week: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Project / Capstone</h1>

      {project?.mentorAssignment && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Your mentor</div>
          <p className="mt-1 text-sm">{project.mentorAssignment.mentor.fullName}</p>
        </Card>
      )}

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Milestones</div>
        <ul className="mt-3 space-y-2">
          {milestones.map((m) => {
            const done = project?.milestoneProgress.find((p) => p.milestoneId === m.id)?.completed;
            return (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm">
                <span>Week {m.week} — {m.title}</span>
                <Badge tone={done ? "ok" : "neutral"}>{done ? "Completed" : "Upcoming"}</Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Project details</div>
        <form action={saveProject} className="mt-3 space-y-3">
          <input name="title" defaultValue={project?.title ?? ""} placeholder="Project title" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="problemStatement" defaultValue={project?.problemStatement ?? ""} placeholder="Problem statement" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="teamMembers" defaultValue={project?.teamMembers ?? ""} placeholder="Team members (if applicable)" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="research" defaultValue={project?.research ?? ""} placeholder="Research notes" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="proposedSolution" defaultValue={project?.proposedSolution ?? ""} placeholder="Proposed solution" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="progressNotes" defaultValue={project?.progressNotes ?? ""} placeholder="Progress notes" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="evidenceUrl" defaultValue={project?.evidenceUrl ?? ""} placeholder="Link to evidence / submission" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <Button type="submit">Save project</Button>
        </form>
      </Card>
    </div>
  );
}
