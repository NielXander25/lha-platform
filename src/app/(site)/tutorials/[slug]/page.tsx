import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { EnrollForm } from "./enroll-form";

type Params = Promise<{ slug: string }>;

async function getCourse(slug: string) {
  return prisma.course.findFirst({ where: { slug, active: true } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: course.title, description: course.summary } : {};
}

export default async function CoursePage({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;
  const [course, locations] = await Promise.all([
    getCourse(slug),
    prisma.location.findMany({
      where: { active: true },
      orderBy: [{ isOnline: "desc" }, { city: "asc" }, { name: "asc" }],
      select: { id: true, name: true, city: true, isOnline: true },
    }),
  ]);
  if (!course) notFound();

  const included = [
    `${course.sessionsPerWeek} sessions per week, ${course.sessionLengthMins} minutes each`,
    "A tutor matched to the student's level and goals",
    "Regular progress updates for parents",
    "Learn at a centre, at home, or online",
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/tutorials" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> All tutorials
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">{course.category}</span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{course.level}</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-950">{course.title}</h1>
          <p className="mt-4 text-lg text-stone-600">{course.summary}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Fact icon={CalendarDays} label="Frequency" value={`${course.sessionsPerWeek}× per week`} />
            <Fact icon={Clock} label="Session length" value={`${course.sessionLengthMins} minutes`} />
            <Fact icon={MapPin} label="Where" value={`${locations.length} location${locations.length === 1 ? "" : "s"}`} />
          </div>

          <h2 className="mt-10 text-lg font-semibold text-stone-900">About this tutorial</h2>
          <p className="mt-3 leading-relaxed text-stone-600">{course.description}</p>

          <h2 className="mt-10 text-lg font-semibold text-stone-900">What&apos;s included</h2>
          <ul className="mt-4 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-stone-700">
                <Check className="mt-0.5 size-5 shrink-0 rounded-full bg-brand-100 p-0.5 text-brand-700" />
                {item}
              </li>
            ))}
          </ul>

          {locations.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-semibold text-stone-900">Available locations</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {locations.map((l) => (
                  <li key={l.id} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600">
                    {l.isOnline ? l.name : `${l.name}, ${l.city}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5">
            <p className="text-sm font-medium text-stone-500">Price</p>
            <p className="mt-1">
              <span className="font-display text-4xl font-semibold text-stone-900">{formatPrice(course.price)}</span>
              <span className="text-stone-500"> / {course.billingUnit}</span>
            </p>
            <hr className="my-6 border-stone-100" />
            <h2 className="mb-4 font-semibold text-stone-900">Enrol in this tutorial</h2>
            <EnrollForm courseId={course.id} locations={locations} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <Icon className="size-5 text-brand-600" />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-0.5 font-semibold text-stone-900">{value}</p>
    </div>
  );
}
