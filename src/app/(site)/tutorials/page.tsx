import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tutorials & pricing",
  description: "Browse Learning Hub Africa tutorials and see prices for every course.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorialsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const level = typeof params.level === "string" ? params.level : undefined;

  const [courses, allActive] = await Promise.all([
    prisma.course.findMany({
      where: { active: true, category, level },
      orderBy: [{ price: "asc" }, { title: "asc" }],
    }),
    prisma.course.findMany({ where: { active: true }, select: { category: true, level: true } }),
  ]);

  const categories = [...new Set(allActive.map((c) => c.category))].sort();
  const levels = [...new Set(allActive.map((c) => c.level))].sort();

  const hrefWith = (key: "category" | "level", value?: string) => {
    const next = new URLSearchParams();
    const merged = { category, level, [key]: value };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/tutorials?${qs}` : "/tutorials";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-sun-600">Tutorials</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">
          Courses & pricing
        </h1>
        <p className="mt-4 text-stone-600">
          Clear prices, no hidden fees. Pick a tutorial, enrol, and we&apos;ll assign a tutor and a
          location that suit you.
        </p>
      </header>

      <div className="mt-10 space-y-3">
        <FilterRow label="Subject" items={categories} active={category} href={(v) => hrefWith("category", v)} />
        <FilterRow label="Level" items={levels} active={level} href={(v) => hrefWith("level", v)} />
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
            <CourseCard key={course.id} course={course} />
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
}: {
  label: string;
  items: string[];
  active?: string;
  href: (value?: string) => string;
}) {
  const pill = "rounded-full border px-3.5 py-1.5 text-sm font-medium transition";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-sm font-semibold text-stone-500">{label}</span>
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
          {item}
        </Link>
      ))}
    </div>
  );
}
