import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { addTimetableEntry, confirmTimetable, deleteTimetableEntry, deleteTimetableUpload, retryTimetableReading, uploadTimetable } from "../actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { TimetableUploader } from "@/components/timetable-uploader";
import { FlashMessage, Notice, one, Panel, StatusBadge, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { fieldClass } from "@/lib/ui";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { DAYS, formatTime } from "@/lib/schedule";
import { normaliseCourseCode } from "@/lib/course-learning";
import { readingState, timetableAiConfigured } from "@/lib/timetable-ai";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Background reading happens in the upload action's `after()`; give it time to finish.
export const maxDuration = 120;

export default async function TimetableStep({ searchParams }: { searchParams: SearchParams }) {
  const { student } = await currentStudent();
  const params = await searchParams;
  const [uploads, entries] = await Promise.all([
    prisma.timetableUpload.findMany({
      where: { studentId: student.id },
      select: { id: true, fileName: true, size: true, status: true, extractionNotes: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timetableEntry.findMany({ where: { studentId: student.id }, orderBy: [{ day: "asc" }, { startMin: "asc" }] }),
  ]);
  const ai = timetableAiConfigured();
  const latest = uploads[0];
  const state = latest ? readingState(latest) : null;
  const processing = state === "processing";
  const stuck = state === "stuck";
  const toCheck = entries.filter((e) => e.source === "EXTRACTED" && (e.confidence ?? 1) < 0.8).length;

  return (
    <div className="max-w-3xl space-y-6">
      {processing && <AutoRefresh />}
      <StepHeader
        step="Step 2 of 5"
        title="University timetable"
        description="Upload your official timetable. We schedule tutorials around your lectures, so it's required."
      />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-slate-900">1. Upload your timetable</h2>
          <StatusBadge label={uploads.length ? "Uploaded" : "Required"} tone={uploads.length ? "good" : "warn"} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          A PDF, or a clear photo or screenshot (up to 4 MB). Only you and our staff can see it.
        </p>
        <TimetableUploader action={uploadTimetable} hasUpload={uploads.length > 0} />

        {latest && (
          <div className="mt-4 space-y-3">
            {processing && (
              <Notice>
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                  <span>
                    Reading your timetable… usually under a minute, and this page updates by itself. In a hurry? Add your lectures by hand
                    below and continue; you don&apos;t have to wait.
                  </span>
                </span>
              </Notice>
            )}
            {latest.status === "EXTRACTED" && (
              <Notice tone="success">
                <span className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0" />
                  <span>
                    We read your timetable and added the lectures below. Please check every one against your timetable
                    {toCheck > 0 && <> — <strong>{toCheck}</strong> marked &ldquo;Check this&rdquo; {toCheck === 1 ? "needs" : "need"} a closer look</>}.
                    {latest.extractionNotes && <span className="mt-1 block">Note: {latest.extractionNotes}</span>}
                  </span>
                </span>
              </Notice>
            )}
            {(latest.status === "FAILED" || stuck) && (
              <Notice tone="warning">
                Automatic reading didn&apos;t work this time. Please add your lectures by hand below; it only takes a minute.
                {ai && (
                  <form action={retryTimetableReading} className="mt-2">
                    <input type="hidden" name="id" value={latest.id} />
                    <button className="text-sm font-semibold underline">Try reading it again</button>
                  </form>
                )}
              </Notice>
            )}
            {latest.status === "UPLOADED" && !ai && (
              <Notice>Uploaded. Please add your lectures below so we can avoid clashes.</Notice>
            )}
            <ul className="space-y-1 text-sm">
              {uploads.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <span className="min-w-0 truncate">
                    <a href={`/api/files/timetable/${u.id}`} target="_blank" className="font-medium text-brand-700 underline">{u.fileName}</a>{" "}
                    <span className="text-slate-500">({Math.ceil(u.size / 1024)} KB)</span>
                  </span>
                  <form action={deleteTimetableUpload}>
                    <input type="hidden" name="id" value={u.id} />
                    <button aria-label={`Delete ${u.fileName}`} className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
                      <Trash2 className="size-4" /> Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">2. Check your lectures</h2>
        <p className="mt-1 text-sm text-slate-600">
          {ai ? "Fix anything we read wrongly by removing it and adding the correct one. Add anything we missed." : "Add each lecture, practical and lab from your timetable."}
        </p>

        {entries.length > 0 ? (
          <div className="mt-4 space-y-4">
            {DAYS.map((dayName, day) => {
              const list = entries.filter((e) => e.day === day);
              if (!list.length) return null;
              return (
                <section key={dayName}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">{dayName}</h3>
                  <ul className="space-y-2">
                    {list.map((e) => {
                      const check = e.source === "EXTRACTED" && (e.confidence ?? 1) < 0.8;
                      const code = normaliseCourseCode(e.courseCode) ?? e.courseCode;
                      return (
                        <li
                          key={e.id}
                          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${check ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              {code}
                              {check && <span className="ml-2 align-middle"><StatusBadge label="Check this" tone="warn" /></span>}
                            </p>
                            {e.courseTitle && e.courseTitle !== code && <p className="text-sm text-slate-700">{e.courseTitle}</p>}
                            <p className="mt-1 text-sm text-slate-500">
                              {formatTime(e.startMin)} – {formatTime(e.endMin)}
                              {[e.activityType, e.venue].filter(Boolean).map((x) => ` · ${x}`).join("")}
                            </p>
                          </div>
                          <form action={deleteTimetableEntry}>
                            <input type="hidden" name="id" value={e.id} />
                            <button aria-label={`Remove ${code} on ${dayName}`} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50">
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{processing ? "Your lectures will appear here shortly." : "No lectures yet."}</p>
        )}

        <details className="mt-5" open={!ai || latest?.status === "FAILED" || stuck || processing}>
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">Add a lecture by hand</summary>
          <form action={addTimetableEntry} className="mt-3 grid gap-3 sm:grid-cols-6">
            <input name="courseCode" required placeholder="Code, e.g. MTH 101" className={`${fieldClass} sm:col-span-2`} aria-label="Course code" />
            <input name="courseTitle" placeholder="Title (optional)" className={`${fieldClass} sm:col-span-4`} aria-label="Course title" />
            <select name="day" required defaultValue="0" className={`${fieldClass} sm:col-span-2`} aria-label="Day">
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input name="start" type="time" required step={900} defaultValue="08:00" className={fieldClass} aria-label="Start time" />
            <input name="end" type="time" required step={900} defaultValue="10:00" className={fieldClass} aria-label="End time" />
            <select name="activityType" defaultValue="Lecture" className={`${fieldClass} sm:col-span-2`} aria-label="Type">
              <option>Lecture</option>
              <option>Practical</option>
              <option>Tutorial</option>
              <option>Other</option>
            </select>
            <input name="venue" placeholder="Venue (optional)" className={`${fieldClass} sm:col-span-4`} aria-label="Venue" />
            <div className="sm:col-span-2"><Submit className="w-full px-4 py-2.5 text-sm">Add</Submit></div>
          </form>
        </details>
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">3. Confirm</h2>
        {student.timetableConfirmed ? (
          <p className="mt-2 text-sm text-emerald-700">Confirmed. If anything changes, upload a new version or edit above, then confirm again.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Confirm once every lecture, practical and lab is listed with the right day and time.</p>
        )}
        <form action={confirmTimetable} className="mt-4">
          <Submit>{student.timetableConfirmed ? "Continue" : "My timetable is correct"}</Submit>
        </form>
      </Panel>
    </div>
  );
}
