import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { LEVELS, shortDepartment } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tutorials & pricing",
  description:
    "Browse Learning Hub Africa tutorials for AFIT engineering courses, 100 to 500 Level, and see prices for every course.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorialsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const department = one("department");
  const level = one("level");
  const venue = one("venue");

  const visibleAssignments = { tutor: { active: true }, location: { active: true } };

  const [courses, departments, locations] = await Promise.all([
    prisma.course.findMany({
      where: {
        active: true,
        level,
        ...(department && { departments: { some: { name: department, active: true } } }),
        ...(venue && { assignments: { some: { ...visibleAssignments, location: { active: true, name: venue } } } }),
      },
      include: {
        departments: { where: { active: true }, select: { name: true }, orderBy: { name: "asc" } },
        assignments: { where: visibleAssignments, select: { location: { select: { name: true } } } },
      },
      orderBy: [{ level: "asc" }, { code: "asc" }, { title: "asc" }],
    }),
    prisma.department.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({
      where: { active: true, assignments: { some: { tutor: { active: true }, course: { active: true } } } },
      select: { name: true },
      orderBy: [{ kind: "desc" }, { name: "asc" }],
    }),
  ]);

  const selected = { department, level, venue };
  const hrefWith = (key: keyof typeof selected, value?: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...selected, [key]: value })) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/tutorials?${qs}` : "/tutorials";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-sun-600">Tutorials</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">
          AFIT course tutorials
        </h1>
        <p className="mt-4 text-stone-600">
          Choose your department and level to see the tutorials for your courses, with clear prices,
          the tutor, and the lecture room or hall where each one holds.
        </p>
      </header>

      <div className="mt-10 space-y-3">
        <FilterRow
          label="Department"
          items={departments.map((d) => d.name)}
          active={department}
          href={(v) => hrefWith("department", v)}
          format={shortDepartment}
        />
        <FilterRow label="Level" items={[...LEVELS]} active={level} href={(v) => hrefWith("level", v)} />
        <FilterRow label="Venue" items={locations.map((l) => l.name)} active={venue} href={(v) => hrefWith("venue", v)} />
      </div>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          No tutorials listed yet for{" "}
          {[department, level, venue].filter(Boolean).join(" · ") || "this selection"}.{" "}
          <Link href="/tutorials" className="font-semibold text-brand-700 underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              places={[...new Set(course.assignments.map((a) => a.location.name))]}
              departments={
                course.departments.length === departments.length
                  ? "All departments"
                  : course.departments.map((d) => shortDepartment(d.name)).join(", ")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  items,
  active,
  href,
  format = (v) => v,
}: {
  label: string;
  items: string[];
  active?: string;
  href: (value?: string) => string;
  format?: (value: string) => string;
}) {
  const pill = "rounded-full border px-3.5 py-1.5 text-sm font-medium transition";
  const on = "border-brand-600 bg-brand-600 text-white";
  const off = "border-stone-200 bg-white text-stone-600 hover:border-brand-300";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 text-sm font-semibold text-stone-500">{label}</span>
      <Link href={href(undefined)} className={cn(pill, !active ? on : off)}>
        All
      </Link>
      {items.map((item) => (
        <Link key={item} href={href(item)} className={cn(pill, active === item ? on : off)}>
          {format(item)}
        </Link>
      ))}
    </div>
  );
}
