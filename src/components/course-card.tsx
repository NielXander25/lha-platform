import Link from "next/link";
import { ArrowRight, Clock, Repeat } from "lucide-react";
import type { Course } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/tutorials/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-stone-900/5"
    >
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">{course.category}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{course.level}</span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-brand-950">{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{course.summary}</p>
      <div className="mt-5 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <Repeat className="size-3.5" /> {course.sessionsPerWeek}× / week
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {course.sessionLengthMins} min
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
