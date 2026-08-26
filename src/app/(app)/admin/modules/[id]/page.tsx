import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  updateModule,
  addResource,
  setCalendarEvent,
  createAssessment,
  addQuestion,
} from "../actions";

export default async function AdminModuleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({
    where: { id },
    include: { resources: true, calendarEvent: true, assessment: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!mod) notFound();

  const boundUpdate = updateModule.bind(null, mod.id);
  const boundResource = addResource.bind(null, mod.id);
  const boundEvent = setCalendarEvent.bind(null, mod.id);
  const boundAssessment = createAssessment.bind(null, mod.id);
  const boundQuestion = mod.assessment ? addQuestion.bind(null, mod.assessment.id, mod.id) : null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">
        Module {mod.number} — {mod.title}
      </h1>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Details</div>
        <form action={boundUpdate} className="mt-3 space-y-3">
          <input name="title" defaultValue={mod.title} placeholder="Title" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="description" defaultValue={mod.description ?? ""} placeholder="Description" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="learningObjectives" defaultValue={mod.learningObjectives ?? ""} placeholder="Learning objectives" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="meetingLink" defaultValue={mod.meetingLink ?? ""} placeholder="Teams meeting link" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="recordingUrl" defaultValue={mod.recordingUrl ?? ""} placeholder="Recording URL (after session)" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="reflectionPrompt" defaultValue={mod.reflectionPrompt ?? ""} placeholder="Reflection prompt" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex flex-wrap items-center gap-3">
            <select name="availability" defaultValue={mod.availability} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="AUTOMATED">Auto-unlock on date</option>
              <option value="MANUAL">Manual unlock</option>
            </select>
            <input name="availableFrom" type="date" defaultValue={mod.availableFrom?.toISOString().slice(0, 10) ?? ""} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="manuallyUnlocked" defaultChecked={mod.manuallyUnlocked} className="accent-[var(--color-navy)]" />
              Unlocked now
            </label>
          </div>
          <Button type="submit" variant="secondary">Save details</Button>
        </form>
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Session (calendar)</div>
        <form action={boundEvent} className="mt-3 space-y-2">
          <input name="eventTitle" defaultValue={mod.calendarEvent?.title ?? ""} placeholder="Event title" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input name="eventDate" type="date" defaultValue={mod.calendarEvent?.date?.toISOString().slice(0, 10) ?? ""} className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="eventTime" defaultValue={mod.calendarEvent?.time ?? ""} placeholder="Time" className="w-32 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <input name="facilitator" defaultValue={mod.calendarEvent?.facilitator ?? ""} placeholder="Facilitator name" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="meetingLink2" defaultValue={mod.calendarEvent?.meetingLink ?? ""} placeholder="Meeting link" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="preparation" defaultValue={mod.calendarEvent?.preparation ?? ""} placeholder="What to prepare" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary">Save session</Button>
        </form>
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Resources</div>
        <ul className="mt-2 space-y-1 text-sm">
          {mod.resources.map((r) => <li key={r.id}>{r.title} — {r.type}</li>)}
        </ul>
        <form action={boundResource} className="mt-3 flex flex-wrap gap-2">
          <input name="title" placeholder="Title" required className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="url" placeholder="URL" required className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <select name="type" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
            <option value="slides">Slides</option>
            <option value="pdf">PDF</option>
            <option value="reading">Reading</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </select>
          <Button type="submit" variant="secondary">Add</Button>
        </form>
      </Card>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Assessment</div>
        {!mod.assessment ? (
          <form action={boundAssessment} className="mt-3 flex gap-2">
            <input name="title" placeholder="Assessment title" className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
            <Button type="submit" variant="secondary">Create assessment</Button>
          </form>
        ) : (
          <>
            <ul className="mt-2 space-y-2 text-sm">
              {mod.assessment.questions.map((q, i) => (
                <li key={q.id} className="rounded-lg border border-[var(--color-line)] px-3 py-2">
                  {i + 1}. [{q.type}] {q.prompt}
                </li>
              ))}
              {mod.assessment.questions.length === 0 && (
                <p className="text-[var(--color-ink)]/50">No questions yet.</p>
              )}
            </ul>
            {boundQuestion && (
              <form action={boundQuestion} className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
                <select name="type" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
                  <option value="MULTIPLE_CHOICE">Multiple choice</option>
                  <option value="MULTIPLE_ANSWER">Multiple answer</option>
                  <option value="SHORT_ANSWER">Short answer</option>
                  <option value="LONG_ANSWER">Long answer</option>
                  <option value="SCENARIO">Scenario</option>
                </select>
                <textarea name="prompt" required placeholder="Question prompt" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                <textarea name="options" placeholder={"Options — one per line (MC/multi-answer only)"} rows={3} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                <input name="correct" placeholder="Correct option number(s), e.g. 2 or 1,3 (MC/multi-answer only)" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
                <Button type="submit" variant="secondary">Add question</Button>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
