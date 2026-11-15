import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tutorials & pricing",
  description: "Browse Learning Hub Africa tutorials for AFIT courses and see prices for every course.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorialsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const level = typeof params.level === "string" ? params.level : undefined;
  const venue = typeof params.venue === "string" ? params.venue : undefined;

  const visibleAssignments = { tutor: { active: true }, location: { active: true } };

  const [courses, allActive, locations] = await Promise.all([
    prisma.course.findMany({
      where: {
        active: true,
        category,
        level,
        ...(venue && { assignments: { some: { ...visibleAssignments, location: { active: true, name: venue } } } }),
      },
      include: {
        assignments: { where: visibleAssignments, select: { location: { select: { name: true } } } },
      },
      orderBy: [{ level: "asc" }, { code: "asc" }, { title: "asc" }],
    }),
    prisma.course.findMany({ where: { active: true }, select: { category: true, level: true } }),
    prisma.location.findMany({
      where: { active: true, assignments: { some: { tutor: { active: true }, course: { active: true } } } },
      select: { name: true },
      orderBy: [{ kind: "desc" }, { name: "asc" }],
    }),
  ]);

  const categories = [...new Set(allActive.map((c) => c.category))].sort();
  const levels = [...new Set(allActive.map((c) => c.level))].sort();
  const venues = locations.map((l) => l.name);

  const hrefWith = (key: "category" | "level" | "venue", value?: string) => {
    const next = new URLSearchParams();
    const merged = { category, level, venue, [key]: value };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
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
          Clear prices, no hidden fees. See who teaches each tutorial and where it takes place, then
          contact us with any questions.
        </p>
      </header>

      <div className="mt-10 space-y-3">
        <FilterRow label="Subject" items={categories} active={category} href={(v) => hrefWith("category", v)} />
        <FilterRow label="Level" items={levels} active={level} href={(v) => hrefWith("level", v)} />
        <FilterRow label="Venue" items={venues} active={venue} href={(v) => hrefWith("venue", v)} />
      </div>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          No tutorials match those filters.{" "}
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
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-sm font-semibold text-stone-500">{label}</span>
      <Link
        href={href(undefined)}
        className={cn(pill, !active ? "border-brand-600 bg-brand-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-brand-300")}
      >
        All
      </Link>
      {items.map((item) => (
        <Link
          key={item}
          href={href(item)}
          className={cn(pill, active === item ? "border-brand-600 bg-brand-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-brand-300")}
        >
          {format(item)}
        </Link>
      ))}
    </div>
  );
}
