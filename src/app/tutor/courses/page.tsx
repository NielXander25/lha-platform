import { saveTutorCourses } from "../actions";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { LEVELS } from "@/lib/constants";
import { currentTutor } from "@/lib/current";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorCourses({ searchParams }: { searchParams: SearchParams }) {
  const { tutor } = await currentTutor();
  const params = await searchParams;
  const [courses, mine] = await Promise.all([
    prisma.course.findMany({ where: { active: true }, orderBy: [{ level: "asc" }, { code: "asc" }] }),
    prisma.tutorCourse.findMany({ where: { tutorId: tutor.id } }),
  ]);
  const chosen = new Map(mine.map((m) => [m.courseId, m.approved]));

  return (
    <div className="max-w-3xl">
      <StepHeader step="Step 2 of 3" title="Courses you can teach" description="An administrator approves each course before you're matched with students for it." />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <form action={saveTutorCourses} className="space-y-6">
        {LEVELS.map((level) => {
          const list = courses.filter((c) => c.level === level);
          if (!list.length) return null;
          return (
            <Panel key={level}>
              <h2 className="font-semibold text-slate-900">{level}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {list.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 has-checked:border-brand-500 has-checked:bg-brand-50">
                    <input type="checkbox" name="courseIds" value={c.id} defaultChecked={chosen.has(c.id)} className="mt-0.5 size-4 shrink-0 accent-brand-600" />
                    <span className="text-sm">
                      <span className="block font-semibold text-slate-900">{c.code ? `${c.code}: ` : ""}{c.title}</span>
                      {chosen.get(c.id) && <span className="text-xs font-semibold text-emerald-700">Approved</span>}
                    </span>
                  </label>
                ))}
              </div>
            </Panel>
          );
        })}
        <Submit>Save and continue</Submit>
      </form>
    </div>
  );
}
