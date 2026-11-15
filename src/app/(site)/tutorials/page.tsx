import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { LEVELS, PRICE_UNIT, shortDepartment } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn, formatPrice } from "@/lib/utils";

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

  const [courses, departments, locations, tiers] = await Promise.all([
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
    prisma.pricingTier.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }] }),
  ]);
  const fromPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : undefined;

  const selected = { department, level, venue };
  const hrefWith = (key: keyof typeof selected, value?: string) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...selected, [key]: value })) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/tutorials?${qs}` : "/tutorials";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Tutorials</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl tracking-tight text-brand-950">
          AFIT course tutorials
        </h1>
        <p className="mt-4 text-slate-600">
          Choose your department and level to see the tutorials for your courses, with clear prices,
          the tutor, and the lecture room or hall where each one holds.
        </p>
      </header>

      {tiers.length > 0 && (
        <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-sm font-semibold text-brand-900">Pricing for every course ({PRICE_UNIT})</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {tiers.map((t) => (
              <li key={t.id} className="rounded-xl bg-white px-4 py-3">
                <p className="font-display text-2xl font-semibold text-brand-800">{formatPrice(t.price)}</p>
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">{t.ratio}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 space-y-3">
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
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
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
              fromPrice={fromPrice}
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
  const off = "border-slate-200 bg-white text-slate-600 hover:border-brand-300";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-sm font-semibold text-slate-500 sm:w-24">{label}</span>
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
