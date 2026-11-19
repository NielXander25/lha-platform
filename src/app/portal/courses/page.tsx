import { saveCourses } from "../actions";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { normaliseCourseCode } from "@/lib/course-learning";
import { Sparkles } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const MODES = [
  { value: "IN_PERSON", label: "In person on campus" },
  { value: "ONLINE", label: "Online" },
  { value: "BOTH", label: "Either is fine" },
];

export default async function CoursesStep({ searchParams }: { searchParams: SearchParams }) {
  const { student } = await currentStudent();
  const params = await searchParams;
  const [packages, courses, chosen, lectures] = await Promise.all([
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.course.findMany({
      where: { active: true },
      include: { departments: { select: { id: true } } },
      orderBy: [{ level: "asc" }, { code: "asc" }],
    }),
    prisma.studentCourse.findMany({ where: { studentId: student.id }, select: { courseId: true } }),
    prisma.timetableEntry.findMany({ where: { studentId: student.id }, select: { courseCode: true } }),
  ]);
  const chosenIds = new Set(chosen.map((c) => c.courseId));
  // Courses on the student's own timetable come first, then their department and level, then the rest.
  const onTimetable = new Set(lectures.map((l) => normaliseCourseCode(l.courseCode)).filter(Boolean));
  const fromTimetable = courses.filter((c) => c.code && onTimetable.has(normaliseCourseCode(c.code)));
  const mine = courses.filter(
    (c) => !fromTimetable.includes(c) && c.level === student.level && (!student.departmentId || c.departments.some((d) => d.id === student.departmentId)),
  );
  const others = courses.filter((c) => !fromTimetable.includes(c) && !mine.includes(c));

  const CourseBox = ({ c }: { c: (typeof courses)[number] }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 has-checked:border-brand-500 has-checked:bg-brand-50">
      <input type="checkbox" name="courseIds" value={c.id} defaultChecked={chosenIds.has(c.id)} className="mt-0.5 size-4 shrink-0 accent-brand-600" />
      <span className="text-sm">
        <span className="block font-semibold text-slate-900">{c.code ? `${c.code}: ` : ""}{c.title}</span>
        <span className="text-slate-500">{c.level}</span>
      </span>
    </label>
  );

  return (
    <div className="max-w-3xl">
      <StepHeader step="Step 3 of 5" title="Courses & package" description="Pick the courses you need help with and how you'd like to be taught." />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <form action={saveCourses} className="space-y-6">
        <Panel>
          <h2 className="font-semibold text-slate-900">Package</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {packages.map((p) => (
              <label key={p.id} className="flex cursor-pointer flex-col rounded-2xl border border-slate-200 p-4 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600/20">
                <span className="flex items-center gap-2">
                  <input type="radio" name="packageId" value={p.id} required defaultChecked={student.packageId === p.id} className="size-4 accent-brand-600" />
                  <span className="font-semibold text-slate-900">{p.name}</span>
                </span>
                <span className="mt-1 text-sm text-accent-600">{p.ratio}</span>
                <span className="mt-2 text-sm text-slate-600">{p.description}</span>
                <span className="mt-3 font-display text-2xl font-semibold text-slate-900">
                  {formatPrice(p.monthlyPrice)}<span className="text-sm font-normal text-slate-500"> / month</span>
                </span>
                <span className="text-xs text-slate-500">or {formatPrice(p.quarterlyPrice)} for 3 months upfront</span>
              </label>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Pay</legend>
              <div className="mt-2 space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="billingCycle" value="MONTHLY" defaultChecked={student.billingCycle !== "QUARTERLY"} className="size-4 accent-brand-600" /> Monthly
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="billingCycle" value="QUARTERLY" defaultChecked={student.billingCycle === "QUARTERLY"} className="size-4 accent-brand-600" /> Three months upfront
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Teaching mode</legend>
              <div className="mt-2 space-y-2 text-sm">
                {MODES.map((m) => (
                  <label key={m.value} className="flex items-center gap-2">
                    <input type="radio" name="teachingMode" value={m.value} defaultChecked={student.teachingMode === m.value} className="size-4 accent-brand-600" /> {m.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </Panel>

        <Panel>
          <h2 className="font-semibold text-slate-900">Courses you need help with</h2>
          {fromTimetable.length > 0 && (
            <>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-700">
                <Sparkles className="size-4" /> From your timetable. Tick the ones you want tutorials for.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{fromTimetable.map((c) => <CourseBox key={c.id} c={c} />)}</div>
            </>
          )}
          {mine.length > 0 && (
            <details className={fromTimetable.length ? "mt-5" : "mt-1"} open={fromTimetable.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">Other courses for your department and level ({mine.length})</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{mine.map((c) => <CourseBox key={c.id} c={c} />)}</div>
            </details>
          )}
          {others.length > 0 && (
            <details className="mt-5" open={mine.length === 0 && fromTimetable.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">All other courses ({others.length})</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{others.map((c) => <CourseBox key={c.id} c={c} />)}</div>
            </details>
          )}
          <p className="mt-4 text-xs text-slate-500">Can&apos;t find your course? Add it to your timetable in the previous step and it appears here.</p>
        </Panel>

        <Submit>Save and continue</Submit>
      </form>
    </div>
  );
}
