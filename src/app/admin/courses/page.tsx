import Link from "next/link";
import { connection } from "next/server";
import { createCourse, toggleCourse, updateCourseAudience } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { LEVELS, shortDepartment } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminCoursesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const [courses, departments] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ level: "asc" }, { code: "asc" }, { title: "asc" }],
      include: { departments: { select: { id: true } }, _count: { select: { assignments: true } } },
    }),
    prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Courses" description="Set each course's level and the departments that take it. Prices are set once for all courses under Pricing." />
      <ErrorBanner message={firstString(params.error)} />

      <div className="space-y-4">
        {courses.map((c) => {
          const linked = new Set(c.departments.map((d) => d.id));
          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/tutorials/${c.slug}`} className="font-semibold text-stone-900 hover:text-brand-700">
                    {c.code ? `${c.code}: ` : ""}{c.title}
                  </Link>
                  <p className="text-sm text-stone-500">
                    {c.category} · {c._count.assignments} tutor{c._count.assignments === 1 ? "" : "s"} assigned
                  </p>
                </div>
                <form action={toggleCourse} className="flex items-center gap-3">
                  <input type="hidden" name="id" value={c.id} />
                  <ActiveBadge active={c.active} />
                  <button className="text-xs font-semibold text-brand-700 hover:underline">{c.active ? "Hide" : "Show"}</button>
                </form>
              </div>

              <div className="mt-4 space-y-5 border-t border-stone-100 pt-4">
                <form key={`${c.level}:${[...linked].sort().join(",")}`} action={updateCourseAudience} className="space-y-3">
                  <input type="hidden" name="id" value={c.id} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Departments that take this course</p>
                  <DepartmentBoxes departments={departments} checked={(id) => linked.has(id)} />
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Level">
                      <select name="level" defaultValue={c.level} className={cn(inputClass, "w-32")}>
                        {LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </Field>
                    <SubmitButton variant="ghost">Save level & departments</SubmitButton>
                  </div>
                </form>
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-stone-900">Add a course</h2>
      <Card className="p-5">
        <form action={createCourse} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Course code"><input name="code" placeholder="e.g. EEE 201" className={inputClass} /></Field>
          <div className="lg:col-span-3"><Field label="Course title"><input name="title" required placeholder="e.g. Applied Electricity I" className={inputClass} /></Field></div>
          <Field label="Subject"><input name="category" required placeholder="e.g. Mathematics" className={inputClass} /></Field>
          <Field label="Level">
            <select name="level" defaultValue="100 Level" className={inputClass}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Sessions / week"><input name="sessionsPerWeek" type="number" min={1} max={14} defaultValue={2} required className={inputClass} /></Field>
          <Field label="Session length (mins)"><input name="sessionLengthMins" type="number" min={15} step={15} defaultValue={120} required className={inputClass} /></Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Departments that take this course</p>
            <DepartmentBoxes departments={departments} checked={() => false} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Short summary"><input name="summary" required className={inputClass} /></Field></div>
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Full description"><textarea name="description" rows={3} required className={inputClass} /></Field></div>
          <div><SubmitButton>Add course</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}

function DepartmentBoxes({
  departments,
  checked,
}: {
  departments: { id: string; name: string }[];
  checked: (id: string) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {departments.map((d) => (
        <label key={d.id} className="flex items-center gap-1.5 text-sm text-stone-700">
          <input type="checkbox" name="departmentIds" value={d.id} defaultChecked={checked(d.id)} className="size-4 accent-brand-600" />
          {shortDepartment(d.name)}
        </label>
      ))}
    </div>
  );
}
