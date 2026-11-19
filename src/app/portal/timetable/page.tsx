import { Trash2, Upload } from "lucide-react";
import { addTimetableEntry, confirmTimetable, deleteTimetableEntry, uploadTimetable } from "../actions";
import { FlashMessage, Notice, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit, fieldClass } from "@/components/forms";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { DAYS, DAYS_SHORT, formatTime } from "@/lib/schedule";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TimetableStep({ searchParams }: { searchParams: SearchParams }) {
  const { student } = await currentStudent();
  const params = await searchParams;
  const [uploads, entries] = await Promise.all([
    prisma.timetableUpload.findMany({
      where: { studentId: student.id },
      select: { id: true, fileName: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timetableEntry.findMany({ where: { studentId: student.id }, orderBy: [{ day: "asc" }, { startMin: "asc" }] }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <StepHeader
        step="Step 3 of 5"
        title="University timetable"
        description="We schedule tutorials around your lectures, so we need your timetable."
      />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />

      <Panel>
        <h2 className="font-semibold text-slate-900">1. Upload your timetable</h2>
        <p className="mt-1 text-sm text-slate-600">PDF, JPG or PNG, up to 5 MB. Only you and our staff can see it.</p>
        <form action={uploadTimetable} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/png,image/jpeg"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700 sm:w-auto"
          />
          <Submit className="flex items-center gap-2 px-5 py-2.5 text-sm">
            <Upload className="inline size-4" /> Upload
          </Submit>
        </form>
        {uploads.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {uploads.map((u) => (
              <li key={u.id}>
                <a href={`/api/files/timetable/${u.id}`} className="font-medium text-brand-700 underline">{u.fileName}</a>{" "}
                <span className="text-slate-500">({Math.ceil(u.size / 1024)} KB)</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Notice>Automatic reading of uploaded timetables is coming soon. For now, please also add your lectures below.</Notice>
        </div>
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">2. Add your lectures</h2>
        <form action={addTimetableEntry} className="mt-4 grid gap-3 sm:grid-cols-6">
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

        {entries.length > 0 ? (
          <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-10 shrink-0 font-semibold text-brand-800">{DAYS_SHORT[e.day]}</span>
                <span className="w-36 shrink-0 text-slate-600">{formatTime(e.startMin)} – {formatTime(e.endMin)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-slate-900">{e.courseCode}</span>
                  <span className="text-slate-500">{[e.activityType, e.venue].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
                </span>
                <form action={deleteTimetableEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button aria-label={`Remove ${e.courseCode}`} className="text-rose-600 hover:text-rose-700"><Trash2 className="size-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-slate-500">No lectures added yet.</p>
        )}
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">3. Check and confirm</h2>
        {student.timetableConfirmed ? (
          <p className="mt-2 text-sm text-emerald-700">Confirmed. If anything changes, edit it above and confirm again.</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Make sure every lecture, practical and lab is listed with the right times.</p>
        )}
        <form action={confirmTimetable} className="mt-4">
          <Submit>{student.timetableConfirmed ? "Continue" : "My timetable is correct"}</Submit>
        </form>
      </Panel>
    </div>
  );
}
