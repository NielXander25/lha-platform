import Link from "next/link";
import { ArrowRight, Clock, GraduationCap, MapPin, Repeat } from "lucide-react";
import type { Course } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

export function CourseCard({
  course,
  places,
  departments,
}: {
  course: Course;
  places: string[];
  departments: string;
}) {
  return (
    <Link
      href={`/tutorials/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-stone-900/5"
    >
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">{course.category}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{course.level}</span>
      </div>
      {course.code && <p className="mt-4 text-sm font-bold tracking-wide text-sun-600">{course.code}</p>}
      <h3 className={`font-display text-xl font-semibold text-brand-950 ${course.code ? "mt-1" : "mt-4"}`}>{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{course.summary}</p>
      {departments && (
        <p className="mt-4 flex gap-1.5 text-xs text-stone-500">
          <GraduationCap className="size-3.5 shrink-0" /> {departments}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <Repeat className="size-3.5" /> {course.sessionsPerWeek}× / week
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {course.sessionLengthMins} min
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {places.length ? places.join(", ") : "Locations coming soon"}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-5">
        <p>
          <span className="font-display text-2xl font-semibold text-stone-900">
            {formatPrice(course.price)}
          </span>
          <span className="text-sm text-stone-500"> / {course.billingUnit}</span>
        </p>
        <span className="flex items-center gap-1 text-sm font-semibold text-brand-700">
          Details <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
