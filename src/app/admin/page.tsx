import Link from "next/link";
import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { createAssignment, deleteAssignment, updateAssignmentSchedule } from "./actions";
import { Card, ErrorBanner, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AssignmentsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;

  const [courses, tutors, locations] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ active: "desc" }, { level: "asc" }, { code: "asc" }, { title: "asc" }],
      include: {
        assignments: {
          include: { tutor: true, location: true },
          orderBy: [{ location: { kind: "desc" } }, { location: { name: "asc" } }],
        },
      },
    }),
    prisma.tutor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: [{ kind: "desc" }, { name: "asc" }] }),
  ]);

  const unassigned = courses.filter((c) => c.active && c.assignments.length === 0).length;
  const locLabel = (l: { name: string; kind: string }) => `${l.name} (${l.kind})`;

  return (
    <div>
      <PageHeader
        title="Tutor assignments"
        description="Assign tutors to each tutorial along with a location. Visitors see these on the tutorial's page."
      />
      <ErrorBanner message={firstString(params.error)} />
      {unassigned > 0 && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {unassigned} visible tutorial{unassigned === 1 ? " has" : "s have"} no tutor yet.
        </p>
      )}

      <div className="space-y-5">
        {courses.map((c) => (
          <Card key={c.id} className={cn("p-5", !c.active && "opacity-60")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/tutorials/${c.slug}`} className="font-semibold text-stone-900 hover:text-brand-700">
                  {c.code ? `${c.code}: ` : ""}{c.title}
                </Link>
                <p className="text-sm text-stone-500">
                  {c.category} · {c.level}
                  {!c.active && " · hidden from visitors"}
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {c.assignments.length} assignment{c.assignments.length === 1 ? "" : "s"}
              </span>
            </div>

            {c.assignments.length > 0 && (
              <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
                {c.assignments.map((a) => (
                  <li key={a.id} className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-center">
                    <span className={cn("font-medium text-stone-800", !a.tutor.active && "text-stone-400 line-through")}>
                      {a.tutor.name}
                    </span>
                    <span className={cn("text-stone-600", !a.location.active && "text-stone-400 line-through")}>
                      {locLabel(a.location)}
                    </span>
                    <form key={a.schedule ?? ""} action={updateAssignmentSchedule} className="flex gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input name="schedule" defaultValue={a.schedule ?? ""} placeholder="Schedule, e.g. Tue & Thu, 4 pm" className={inputClass} aria-label="Schedule" />
                      <SubmitButton variant="ghost">Save</SubmitButton>
                    </form>
                    <form action={deleteAssignment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline" aria-label={`Remove ${a.tutor.name} at ${a.location.name}`}>
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={createAssignment} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input type="hidden" name="courseId" value={c.id} />
              <select name="tutorId" required defaultValue="" className={inputClass} aria-label="Tutor">
                <option value="" disabled>Choose tutor…</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.subjects}</option>
                ))}
              </select>
              <select name="locationId" required defaultValue="" className={inputClass} aria-label="Location">
                <option value="" disabled>Choose location…</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{locLabel(l)}</option>
                ))}
              </select>
              <input name="schedule" placeholder="Schedule (optional)" className={inputClass} aria-label="Schedule" />
              <SubmitButton>Assign</SubmitButton>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
